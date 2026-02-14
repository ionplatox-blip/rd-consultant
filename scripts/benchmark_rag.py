#!/usr/bin/env python3
"""
RAG System Benchmark Test
==========================
Tests the AI R&D Consultant with 20 diverse questions to verify:
1. System is using the knowledge base (not hallucinating)
2. Retrieval quality (relevant chunks are found)
3. Answer accuracy and completeness

Usage:
    python3 scripts/benchmark_rag.py --endpoint local
    python3 scripts/benchmark_rag.py --endpoint production
"""

import requests
import json
import time
from typing import List, Dict
import argparse

# Test questions covering different aspects of R&D knowledge base
BENCHMARK_QUESTIONS = [
    # Tax benefits and льготы
    {
        "id": 1,
        "question": "Какие налоговые льготы существуют для НИОКР в России?",
        "category": "tax_benefits",
        "expected_keywords": ["налог", "льгот", "вычет", "НИОКР"]
    },
    {
        "id": 2,
        "question": "Как рассчитывается налоговый вычет на НИОКР?",
        "category": "tax_calculation",
        "expected_keywords": ["расчет", "вычет", "коэффициент"]
    },
    {
        "id": 3,
        "question": "Какие расходы можно включить в налоговый вычет по НИОКР?",
        "category": "tax_expenses",
        "expected_keywords": ["расход", "затрат", "включ"]
    },
    
    # Documentation and оформление
    {
        "id": 4,
        "question": "Какие документы необходимы для подтверждения НИОКР?",
        "category": "documentation",
        "expected_keywords": ["документ", "подтвержд", "оформ"]
    },
    {
        "id": 5,
        "question": "Что такое техническое задание на НИОКР?",
        "category": "technical_spec",
        "expected_keywords": ["техническ", "задан", "ТЗ"]
    },
    {
        "id": 6,
        "question": "Как правильно оформить отчет о выполнении НИОКР?",
        "category": "reporting",
        "expected_keywords": ["отчет", "оформ", "выполнен"]
    },
    
    # Accounting and учет
    {
        "id": 7,
        "question": "Как учитываются расходы на НИОКР в бухгалтерском учете?",
        "category": "accounting",
        "expected_keywords": ["учет", "расход", "бухгалтер"]
    },
    {
        "id": 8,
        "question": "Что такое НМА и как они связаны с НИОКР?",
        "category": "intangible_assets",
        "expected_keywords": ["НМА", "нематериальн", "актив"]
    },
    {
        "id": 9,
        "question": "Какие есть особенности амортизации результатов НИОКР?",
        "category": "amortization",
        "expected_keywords": ["амортизац", "списан", "срок"]
    },
    
    # Grants and субсидии
    {
        "id": 10,
        "question": "Какие гранты доступны для финансирования НИОКР?",
        "category": "grants",
        "expected_keywords": ["грант", "субсиди", "финансиров"]
    },
    {
        "id": 11,
        "question": "Что такое фонд МИК и как получить поддержку?",
        "category": "mik_fund",
        "expected_keywords": ["МИК", "фонд", "поддержк"]
    },
    
    # Patents and IP
    {
        "id": 12,
        "question": "Как оформить патент на результат НИОКР?",
        "category": "patents",
        "expected_keywords": ["патент", "оформ", "результат"]
    },
    {
        "id": 13,
        "question": "Что такое интеллектуальная собственность в контексте НИОКР?",
        "category": "ip",
        "expected_keywords": ["интеллектуальн", "собственност", "ИС"]
    },
    
    # Criteria and критерии
    {
        "id": 14,
        "question": "Какие критерии определяют, является ли работа НИОКР?",
        "category": "criteria",
        "expected_keywords": ["критери", "определ", "признак"]
    },
    {
        "id": 15,
        "question": "Чем отличается НИОКР от обычной разработки?",
        "category": "distinction",
        "expected_keywords": ["отлич", "разработк", "научн"]
    },
    
    # Risks and риски
    {
        "id": 16,
        "question": "Какие риски существуют при проведении НИОКР?",
        "category": "risks",
        "expected_keywords": ["риск", "неопределенност", "неудач"]
    },
    
    # Stages and этапы
    {
        "id": 17,
        "question": "Какие этапы включает проект НИОКР?",
        "category": "stages",
        "expected_keywords": ["этап", "стади", "фаз"]
    },
    
    # Personnel and персонал
    {
        "id": 18,
        "question": "Какие требования к персоналу для выполнения НИОКР?",
        "category": "personnel",
        "expected_keywords": ["персонал", "сотрудник", "квалификац"]
    },
    
    # Edge cases - should return "no info"
    {
        "id": 19,
        "question": "Какая погода будет завтра?",
        "category": "irrelevant",
        "expected_keywords": [],
        "should_have_no_answer": True
    },
    {
        "id": 20,
        "question": "Как приготовить борщ?",
        "category": "irrelevant",
        "expected_keywords": [],
        "should_have_no_answer": True
    }
]

def test_endpoint(endpoint_url: str, question_data: Dict) -> Dict:
    """Test a single question against the RAG endpoint."""
    start_time = time.time()
    
    try:
        response = requests.post(
            f"{endpoint_url}/api/chat",
            json={"message": question_data["question"]},
            timeout=30
        )
        elapsed = time.time() - start_time
        
        if response.status_code == 200:
            data = response.json()
            return {
                "success": True,
                "answer": data.get("answer", ""),
                "sources": data.get("sources", []),
                "response_time": elapsed,
                "error": None
            }
        else:
            return {
                "success": False,
                "answer": "",
                "sources": [],
                "response_time": elapsed,
                "error": f"HTTP {response.status_code}"
            }
    except Exception as e:
        elapsed = time.time() - start_time
        return {
            "success": False,
            "answer": "",
            "sources": [],
            "response_time": elapsed,
            "error": str(e)
        }

def evaluate_response(question_data: Dict, result: Dict) -> Dict:
    """Evaluate the quality of a response."""
    evaluation = {
        "has_answer": len(result["answer"]) > 0,
        "has_sources": len(result["sources"]) > 0,
        "answer_length": len(result["answer"]),
        "source_count": len(result["sources"]),
        "keywords_found": 0,
        "quality_score": 0
    }
    
    # Check if this is an irrelevant question
    if question_data.get("should_have_no_answer", False):
        # For irrelevant questions, good response is "no info" type answer
        no_info_phrases = ["нет информации", "не нашёл", "не могу ответить", "контексте нет"]
        has_no_info_response = any(phrase in result["answer"].lower() for phrase in no_info_phrases)
        evaluation["quality_score"] = 100 if has_no_info_response else 0
        evaluation["is_honest_no_answer"] = has_no_info_response
        return evaluation
    
    # Check for expected keywords
    answer_lower = result["answer"].lower()
    for keyword in question_data.get("expected_keywords", []):
        if keyword.lower() in answer_lower:
            evaluation["keywords_found"] += 1
    
    # Calculate quality score (0-100)
    score = 0
    
    # Has answer (30 points)
    if evaluation["has_answer"]:
        score += 30
    
    # Has sources (20 points)
    if evaluation["has_sources"]:
        score += 20
    
    # Answer length (20 points)
    if evaluation["answer_length"] > 200:
        score += 20
    elif evaluation["answer_length"] > 100:
        score += 10
    
    # Keywords found (30 points)
    if len(question_data.get("expected_keywords", [])) > 0:
        keyword_ratio = evaluation["keywords_found"] / len(question_data["expected_keywords"])
        score += int(keyword_ratio * 30)
    
    evaluation["quality_score"] = score
    return evaluation

def run_benchmark(endpoint_url: str):
    """Run the full benchmark test suite."""
    print(f"\n{'='*80}")
    print(f"RAG SYSTEM BENCHMARK TEST")
    print(f"Endpoint: {endpoint_url}")
    print(f"Questions: {len(BENCHMARK_QUESTIONS)}")
    print(f"{'='*80}\n")
    
    results = []
    total_time = 0
    
    for i, question_data in enumerate(BENCHMARK_QUESTIONS, 1):
        print(f"[{i}/{len(BENCHMARK_QUESTIONS)}] Testing: {question_data['question'][:60]}...")
        
        result = test_endpoint(endpoint_url, question_data)
        evaluation = evaluate_response(question_data, result)
        
        results.append({
            "question": question_data,
            "result": result,
            "evaluation": evaluation
        })
        
        total_time += result["response_time"]
        
        # Print quick result
        if result["success"]:
            score = evaluation["quality_score"]
            emoji = "✅" if score >= 70 else "⚠️" if score >= 40 else "❌"
            print(f"  {emoji} Score: {score}/100 | Sources: {evaluation['source_count']} | Time: {result['response_time']:.2f}s\n")
        else:
            print(f"  ❌ Error: {result['error']}\n")
        
        # Small delay to avoid rate limiting
        time.sleep(0.5)
    
    # Print summary
    print(f"\n{'='*80}")
    print(f"BENCHMARK RESULTS SUMMARY")
    print(f"{'='*80}\n")
    
    successful = sum(1 for r in results if r["result"]["success"])
    avg_score = sum(r["evaluation"]["quality_score"] for r in results) / len(results)
    avg_time = total_time / len(results)
    
    print(f"✅ Successful requests: {successful}/{len(BENCHMARK_QUESTIONS)}")
    print(f"📊 Average quality score: {avg_score:.1f}/100")
    print(f"⏱️  Average response time: {avg_time:.2f}s")
    print(f"📚 Questions with sources: {sum(1 for r in results if r['evaluation']['has_sources'])}/{len(BENCHMARK_QUESTIONS)}")
    
    # Category breakdown
    print(f"\n{'='*80}")
    print(f"CATEGORY BREAKDOWN")
    print(f"{'='*80}\n")
    
    categories = {}
    for r in results:
        cat = r["question"]["category"]
        if cat not in categories:
            categories[cat] = []
        categories[cat].append(r["evaluation"]["quality_score"])
    
    for cat, scores in sorted(categories.items()):
        avg_cat_score = sum(scores) / len(scores)
        emoji = "✅" if avg_cat_score >= 70 else "⚠️" if avg_cat_score >= 40 else "❌"
        print(f"{emoji} {cat:20s}: {avg_cat_score:.1f}/100 ({len(scores)} questions)")
    
    # Detailed results
    print(f"\n{'='*80}")
    print(f"DETAILED RESULTS")
    print(f"{'='*80}\n")
    
    for r in results:
        q = r["question"]
        ev = r["evaluation"]
        res = r["result"]
        
        emoji = "✅" if ev["quality_score"] >= 70 else "⚠️" if ev["quality_score"] >= 40 else "❌"
        print(f"{emoji} Q{q['id']}: {q['question']}")
        print(f"   Category: {q['category']}")
        print(f"   Score: {ev['quality_score']}/100")
        print(f"   Answer length: {ev['answer_length']} chars")
        print(f"   Sources: {ev['source_count']}")
        print(f"   Keywords found: {ev['keywords_found']}/{len(q.get('expected_keywords', []))}")
        if res["success"]:
            print(f"   Answer preview: {res['answer'][:150]}...")
        else:
            print(f"   Error: {res['error']}")
        print()
    
    # Save results to JSON
    output_file = f"benchmark_results_{int(time.time())}.json"
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    
    print(f"📄 Full results saved to: {output_file}")
    
    return results, avg_score

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Benchmark RAG system")
    parser.add_argument(
        "--endpoint",
        choices=["local", "production"],
        default="local",
        help="Which endpoint to test"
    )
    
    args = parser.parse_args()
    
    if args.endpoint == "local":
        endpoint_url = "http://localhost:3005"
    else:
        endpoint_url = "https://rd-consultant-ionplato.onrender.com"
    
    results, avg_score = run_benchmark(endpoint_url)
    
    # Exit code based on quality
    if avg_score >= 70:
        print("\n✅ Benchmark PASSED (score >= 70)")
        exit(0)
    elif avg_score >= 40:
        print("\n⚠️  Benchmark MARGINAL (40 <= score < 70)")
        exit(1)
    else:
        print("\n❌ Benchmark FAILED (score < 40)")
        exit(2)
