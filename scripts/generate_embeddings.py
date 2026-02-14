#!/usr/bin/env python3
"""
Knowledge Base Embedding Generator
===================================
Chunks documents and generates vector embeddings for Pinecone.

Usage:
    python3 scripts/generate_embeddings.py
    
Environment variables required:
    - OPENAI_API_KEY
    - PINECONE_API_KEY
"""

import json
import os
from typing import List, Dict
import re

# Install dependencies if needed
try:
    from openai import OpenAI
    from pinecone import Pinecone, ServerlessSpec
except ImportError:
    print("Installing dependencies...")
    os.system("pip install openai pinecone-client tiktoken")
    from openai import OpenAI
    from pinecone import Pinecone, ServerlessSpec

import tiktoken

# Configuration
CHUNK_SIZE = 500  # tokens
CHUNK_OVERLAP = 50  # tokens
EMBEDDING_MODEL = "text-embedding-3-small"
PINECONE_INDEX_NAME = "rd-consultant-kb"
PINECONE_DIMENSION = 1536  # for text-embedding-3-small

def count_tokens(text: str, model: str = "gpt-4o-mini") -> int:
    """Count tokens in text using tiktoken."""
    encoding = tiktoken.encoding_for_model(model)
    return len(encoding.encode(text))

def chunk_text(text: str, chunk_size: int = CHUNK_SIZE, overlap: int = CHUNK_OVERLAP) -> List[str]:
    """
    Split text into overlapping chunks of approximately chunk_size tokens.
    """
    encoding = tiktoken.encoding_for_model("gpt-4o-mini")
    tokens = encoding.encode(text)
    
    chunks = []
    start = 0
    
    while start < len(tokens):
        end = start + chunk_size
        chunk_tokens = tokens[start:end]
        chunk_text = encoding.decode(chunk_tokens)
        chunks.append(chunk_text)
        
        # Move start forward by (chunk_size - overlap)
        start += (chunk_size - overlap)
        
    return chunks

def generate_embeddings(texts: List[str], api_key: str) -> List[List[float]]:
    """Generate embeddings using OpenAI API."""
    client = OpenAI(api_key=api_key)
    
    embeddings = []
    batch_size = 100
    
    for i in range(0, len(texts), batch_size):
        batch = texts[i:i + batch_size]
        print(f"  Generating embeddings for batch {i//batch_size + 1}/{(len(texts)-1)//batch_size + 1}...")
        
        response = client.embeddings.create(
            model=EMBEDDING_MODEL,
            input=batch
        )
        
        batch_embeddings = [item.embedding for item in response.data]
        embeddings.extend(batch_embeddings)
    
    return embeddings

def upload_to_pinecone(chunks_with_metadata: List[Dict], embeddings: List[List[float]], api_key: str):
    """Upload embeddings to Pinecone."""
    pc = Pinecone(api_key=api_key)
    
    # Create index if it doesn't exist
    if PINECONE_INDEX_NAME not in pc.list_indexes().names():
        print(f"Creating Pinecone index '{PINECONE_INDEX_NAME}'...")
        pc.create_index(
            name=PINECONE_INDEX_NAME,
            dimension=PINECONE_DIMENSION,
            metric="cosine",
            spec=ServerlessSpec(cloud="aws", region="us-east-1")
        )
    
    index = pc.Index(PINECONE_INDEX_NAME)
    
    # Prepare vectors for upsert
    vectors = []
    for i, (chunk_meta, embedding) in enumerate(zip(chunks_with_metadata, embeddings)):
        vectors.append({
            "id": f"chunk_{i}",
            "values": embedding,
            "metadata": chunk_meta
        })
    
    # Upsert in batches
    batch_size = 100
    for i in range(0, len(vectors), batch_size):
        batch = vectors[i:i + batch_size]
        print(f"  Uploading batch {i//batch_size + 1}/{(len(vectors)-1)//batch_size + 1}...")
        index.upsert(vectors=batch)
    
    print(f"\n✅ Successfully uploaded {len(vectors)} vectors to Pinecone!")
    print(f"Index stats: {index.describe_index_stats()}")

def main():
    # Load API keys
    openai_key = os.getenv("OPENAI_API_KEY")
    pinecone_key = os.getenv("PINECONE_API_KEY")
    
    if not openai_key:
        print("❌ Error: OPENAI_API_KEY not found in environment variables")
        print("Set it with: export OPENAI_API_KEY='your-key-here'")
        return
    
    if not pinecone_key:
        print("❌ Error: PINECONE_API_KEY not found in environment variables")
        print("Set it with: export PINECONE_API_KEY='your-key-here'")
        return
    
    # Load knowledge base
    kb_path = "knowledge/sources.json"
    if not os.path.exists(kb_path):
        print(f"❌ Error: {kb_path} not found")
        return
    
    with open(kb_path, 'r', encoding='utf-8') as f:
        sources = json.load(f)
    
    print(f"📚 Loaded {len(sources)} sources from knowledge base")
    
    # Process each source
    all_chunks = []
    all_metadata = []
    
    for source in sources:
        print(f"\n📄 Processing: {source['title']}")
        print(f"   Size: {source['char_count']:,} chars")
        
        # Chunk the document
        chunks = chunk_text(source['content'], CHUNK_SIZE, CHUNK_OVERLAP)
        print(f"   Created {len(chunks)} chunks")
        
        # Store chunks with metadata
        for i, chunk in enumerate(chunks):
            all_chunks.append(chunk)
            all_metadata.append({
                "source_id": source['source_id'],
                "title": source['title'],
                "chunk_index": i,
                "total_chunks": len(chunks),
                "text": chunk[:500]  # Store first 500 chars for preview
            })
    
    print(f"\n📊 Total chunks across all sources: {len(all_chunks)}")
    total_tokens = sum(count_tokens(chunk) for chunk in all_chunks)
    print(f"📊 Total tokens: {total_tokens:,}")
    estimated_cost = (total_tokens / 1_000_000) * 0.02  # $0.02 per 1M tokens
    print(f"💰 Estimated OpenAI embedding cost: ${estimated_cost:.4f}")
    
    # Generate embeddings
    print(f"\n🔧 Generating embeddings with {EMBEDDING_MODEL}...")
    embeddings = generate_embeddings(all_chunks, openai_key)
    
    # Upload to Pinecone
    print(f"\n☁️ Uploading to Pinecone index '{PINECONE_INDEX_NAME}'...")
    upload_to_pinecone(all_metadata, embeddings, pinecone_key)
    
    print("\n✅ Embedding generation complete!")
    print(f"\nNext steps:")
    print(f"1. Test the index with a sample query")
    print(f"2. Implement the RAG backend in src/lib/rag.ts")
    print(f"3. Deploy to Render")

if __name__ == "__main__":
    main()
