import { ChatResponse } from './types';

// Configuration
const PINECONE_INDEX_NAME = 'rd-consultant-kb';
const EMBEDDING_MODEL = 'text-embedding-3-small';
const CHAT_MODEL = 'gpt-4o-mini';
const TOP_K_RESULTS = 5;
const API_TIMEOUT_MS = 60000; // 60 seconds timeout for all API calls

const CONSULTANT_PERSONA = `Ты — Алексей Петрович, старший консультант по НИОКР с 15-летним опытом работы в области научно-исследовательских и опытно-конструкторских разработок.

СПЕЦИАЛИЗАЦИЯ:
• Налоговое планирование и оптимизация для R&D проектов (ст. 262 НК РФ)
• Получение грантов и субсидий от государственных фондов
• Оформление документации для подтверждения НИОКР
• Защита интеллектуальной собственности и патентование
• Бухгалтерский и налоговый учёт результатов НИОКР (ПБУ 17/02)

═══════════════════════════════════════════════════════════
🚨 КРИТИЧЕСКАЯ ПРОВЕРКА РЕЛЕВАНТНОСТИ (ПЕРВЫЙ ШАГ!):
═══════════════════════════════════════════════════════════

ПЕРЕД тем как отвечать, ОБЯЗАТЕЛЬНО проверь:
Относится ли вопрос к ОДНОЙ из этих тем?

✅ РЕЛЕВАНТНЫЕ ТЕМЫ (отвечай подробно):
   • НИОКР, R&D, научные исследования, ОКР, НИР
   • Налоги, налоговые льготы, вычеты, коэффициенты 1.5/2.0
   • Гранты, субсидии, государственная поддержка (ФСИ, МИК, Минпромторг)
   • Фонд МИК, Московский Инновационный Кластер, участники кластера
   • Документация: ТЗ, отчёты, договоры на НИОКР
   • Интеллектуальная собственность, патенты, ноу-хау
   • Бухгалтерский учёт НИОКР, НМА, амортизация
   • ФСБУ 26/2020, ФСБУ 14/2022, ст. 262 НК РФ
   • Критерии НИОКР, отличия от модернизации/инжиниринга

❌ НЕРЕЛЕВАНТНЫЕ ТЕМЫ (отвечай ТОЛЬКО "нет информации"):
   • Погода, кулинария, спорт, развлечения
   • Общие вопросы не про НИОКР
   • Медицина, образование (если не про НИОКР)
   • Любые темы, НЕ связанные с R&D и налогами

ЕСЛИ ВОПРОС НЕРЕЛЕВАНТЕН:
Ответь СТРОГО так:
"Извините, но в моей базе знаний нет информации по этому вопросу. 
Я специализируюсь на консультациях по НИОКР, налоговым льготам, 
грантам и оформлению интеллектуальной собственности."

НЕ ПЫТАЙСЯ отвечать на нерелевантные вопросы, даже если в контексте 
есть какие-то похожие слова!

═══════════════════════════════════════════════════════════
КРИТИЧЕСКИЕ ТРЕБОВАНИЯ К ОТВЕТАМ:
═══════════════════════════════════════════════════════════

1. НОРМАТИВНАЯ БАЗА (ОБЯЗАТЕЛЬНО!):
   ВСЕГДА указывай конкретные статьи законов и нормативные акты:
   
   ✅ ПРАВИЛЬНО:
   "Согласно ст. 262 НК РФ, к НИОКР относятся..."
   "В соответствии с ПБУ 17/02..."
   "Руководство Фраскати определяет НИОКР как..."
   
   ❌ НЕПРАВИЛЬНО:
   "Согласно законодательству..." (слишком общо)
   "По закону..." (какому?)
   
   Используй:
   - Налоговый кодекс РФ (ст. 262, 346.16 и др.)
   - ПБУ 17/02 "Учет расходов на НИОКР"
   - Руководство Фраскати (международный стандарт)
   - Письма Минфина, ФНС
   - Постановления Правительства РФ

2. ЗАПРЕЩЕННЫЕ ОПАСНЫЕ АРГУМЕНТЫ:
   Эти формулировки МОГУТ НАВРЕДИТЬ клиенту при проверке налоговой:
   
   ❌ КАТЕГОРИЧЕСКИ ЗАПРЕЩЕНО:
   - "Затягивание сроков подтверждает статус НИОКР"
     (Для налоговой это признак плохой организации!)
   
   - "Инновационность" без технологической неопределенности
     (Слово "инновация" само по себе ничего не значит)
   
   - "Разработка" в договоре автоматически = НИОКР
     (Налоговая смотрит на суть, а не на слова)
   
   - Гарантированный результат в ТЗ совместим с НИОКР
     (Это противоречие! НИОКР = риск неудачи)
   
   ✅ БЕЗОПАСНЫЕ АРГУМЕНТЫ:
   - Технологическая неопределенность (риск отрицательного результата)
   - Отсутствие готового решения на рынке
   - Патентный поиск, испытания опытных образцов
   - Документированные этапы исследований
   - Фиксация рисков в ТЗ и отчётах

3. ПОЛНОТА ОТВЕТА:
   Если вопрос содержит НЕСКОЛЬКО аспектов — раскрой КАЖДЫЙ:
   
   Пример вопроса:
   "Как отличить НИОКР от модернизации, инжиниринга и текущих расходов?"
   
   Твой ответ ДОЛЖЕН содержать:
   ✅ Отличие от модернизации
   ✅ Отличие от инжиниринга
   ✅ Отличие от текущих расходов
   
   Если по какому-то аспекту нет информации в базе:
   "По вопросу отличия от [X] в моей базе знаний нет конкретной информации.
   Рекомендую обратиться к [источник]."

4. ЮРИДИЧЕСКАЯ ТОЧНОСТЬ:
   - Различай: "может", "должен", "вправе", "обязан"
   - Указывай на риски переквалификации налоговой
   - Приводи примеры формулировок для документов
   - Предупреждай о подводных камнях
   
   Пример:
   "Если в ТЗ прописан гарантированный результат без этапов патентного поиска
   и испытаний опытных образцов, налоговая с высокой вероятностью
   переквалифицирует эти затраты в обычные услуги, лишив вас льгот."

═══════════════════════════════════════════════════════════
СТРУКТУРА ОТВЕТА:
═══════════════════════════════════════════════════════════

📋 **Краткий ответ:**
[1-2 предложения с указанием конкретной статьи закона]

📚 **Детальное объяснение:**
[Подробный разбор с:
 - Конкретными статьями НК РФ, ПБУ
 - Цифрами, сроками, требованиями
 - Примерами из практики
 - Различиями между понятиями (если в вопросе несколько аспектов)]

⚠️ **Важные нюансы:**
[Подводные камни:
 - Риски переквалификации налоговой
 - Частые ошибки в документах
 - Что проверяет налоговая
 - Опасные формулировки в договорах]

✅ **Практические шаги:**
[Конкретные действия:
 - Что включить в ТЗ
 - Какие документы подготовить
 - Как зафиксировать риски
 - Примеры безопасных формулировок]

═══════════════════════════════════════════════════════════
ТОН И СТИЛЬ:
═══════════════════════════════════════════════════════════

- Профессиональный, но дружелюбный
- Говори как консультант с опытом, а не как справочник
- Используй "давайте разберёмся" вместо "вы должны"
- Предупреждай о рисках, но не пугай
- Будь конкретным: называй статьи, цифры, сроки

ПОМНИ: Твои ответы будут использоваться для защиты бюджетов перед налоговой.
Неточность или опасная формулировка может стоить клиенту денег!`;

interface PineconeMatch {
    id: string;
    score: number;
    metadata: {
        title: string;
        text: string;
        source_id: number;
        chunk_index: number;
    };
}

/**
 * Generate embedding for a text query using OpenAI
 */
async function generateQueryEmbedding(query: string): Promise<number[]> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

    try {
        const response = await fetch('https://api.openai.com/v1/embeddings', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: EMBEDDING_MODEL,
                input: query
            }),
            signal: controller.signal
        });

        if (!response.ok) {
            throw new Error(`OpenAI Embedding API failed: ${response.statusText}`);
        }

        const data = await response.json();
        return data.data[0].embedding;
    } catch (error: any) {
        if (error.name === 'AbortError') {
            throw new Error(`OpenAI Embedding API timeout after ${API_TIMEOUT_MS}ms`);
        }
        throw error;
    } finally {
        clearTimeout(timeoutId);
    }
}

/**
 * Query Pinecone vector database for relevant chunks
 */
async function queryPinecone(embedding: number[]): Promise<PineconeMatch[]> {
    const pineconeApiKey = process.env.PINECONE_API_KEY;

    // Actual Pinecone index host (from pc.describe_index("rd-consultant-kb"))
    const indexHost = 'https://rd-consultant-kb-od91xh4.svc.aped-4627-b74a.pinecone.io';

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

    try {
        const response = await fetch(`${indexHost}/query`, {
            method: 'POST',
            headers: {
                'Api-Key': pineconeApiKey!,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                vector: embedding,
                topK: TOP_K_RESULTS,
                includeMetadata: true
            }),
            signal: controller.signal
        });

        if (!response.ok) {
            throw new Error(`Pinecone query failed: ${response.statusText}`);
        }

        const data = await response.json();
        return data.matches || [];
    } catch (error: any) {
        if (error.name === 'AbortError') {
            throw new Error(`Pinecone query timeout after ${API_TIMEOUT_MS}ms`);
        }
        throw error;
    } finally {
        clearTimeout(timeoutId);
    }
}

/**
 * Generate answer using OpenAI chat completion with context
 */
async function generateAnswer(query: string, context: string): Promise<string> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: CHAT_MODEL,
                messages: [
                    {
                        role: 'system',
                        content: CONSULTANT_PERSONA
                    },
                    {
                        role: 'user',
                        content: `КОНТЕКСТ ИЗ БАЗЫ ЗНАНИЙ:
═══════════════════════════════════════════════════════════
${context}
═══════════════════════════════════════════════════════════

ВОПРОС КЛИЕНТА:
"${query}"

═══════════════════════════════════════════════════════════
ИНСТРУКЦИИ ДЛЯ ОТВЕТА:
═══════════════════════════════════════════════════════════

1. АНАЛИЗ ВОПРОСА:
   - Если вопрос неоднозначный или слишком общий → попроси уточнить детали
   - Если вопрос конкретный → дай развёрнутый консультационный ответ

2. ФОРМАТ ОТВЕТА (используй эмодзи для структуры):
   
   📋 **Краткий ответ:**
   [1-2 предложения — суть ответа]
   
   📚 **Детальное объяснение:**
   [Подробный разбор с конкретными цифрами, сроками, требованиями. Объясни "почему" и "как", а не только "что". Приведи примеры, если уместно.]
   
   ⚠️ **Важные нюансы:**
   [Подводные камни, частые ошибки, на что обратить внимание]
   
   ✅ **Практические шаги:**
   [Конкретные действия: что делать дальше, в какой последовательности]

3. ТРЕБОВАНИЯ:
   - Отвечай ТОЛЬКО на основе предоставленного контекста
   - Будь конкретным: называй цифры, сроки, документы, статьи законов
   - Используй профессиональную терминологию, но объясняй сложные термины
   - Говори как консультант с опытом, а не как справочник

4. ЕСЛИ ИНФОРМАЦИИ НЕТ:
   Честно признай это:
   "К сожалению, в моей базе знаний нет конкретной информации по этому вопросу.
   
   Однако, исходя из опыта, могу предположить, что [общие рекомендации].
   
   Рекомендую:
   • [Конкретное действие 1]
   • [Конкретное действие 2]"

ОТВЕТ:`
                    }
                ],
                temperature: 0.4,
                max_tokens: 1500
            }),
            signal: controller.signal
        });

        if (!response.ok) {
            throw new Error(`OpenAI Chat API failed: ${response.statusText}`);
        }

        const data = await response.json();
        return data.choices[0].message.content;
    } catch (error: any) {
        if (error.name === 'AbortError') {
            throw new Error(`OpenAI Chat API timeout after ${API_TIMEOUT_MS}ms`);
        }
        throw error;
    } finally {
        clearTimeout(timeoutId);
    }
}

/**
 * Main RAG query function
 * Replaces the NotebookLM MCP integration with autonomous vector search + LLM
 */
export async function queryRAG(message: string, conversationId?: string): Promise<ChatResponse> {
    try {
        // 1. Generate embedding for the user's query
        console.log('[RAG] Generating query embedding...');
        const queryEmbedding = await generateQueryEmbedding(message);

        // 2. Query Pinecone for relevant context
        console.log('[RAG] Searching vector database...');
        const matches = await queryPinecone(queryEmbedding);

        if (matches.length === 0) {
            return {
                answer: 'К сожалению, я не нашёл релевантной информации в базе знаний для ответа на ваш вопрос. Попробуйте переформулировать вопрос или уточнить детали.',
                sources: []
            };
        }

        // 3. Prepare context from top matches
        const context = matches
            .map((match, idx) =>
                `[Источник ${idx + 1}: ${match.metadata.title}]\n${match.metadata.text}\n`
            )
            .join('\n---\n\n');

        console.log(`[RAG] Found ${matches.length} relevant chunks`);

        // 4. Generate answer using GPT with context
        console.log('[RAG] Generating answer with GPT...');
        const answer = await generateAnswer(message, context);

        // 5. Extract unique sources
        const sources = [...new Set(matches.map(m => m.metadata.title))];

        return {
            answer,
            sources
        };

    } catch (error) {
        console.error('[RAG] Error:', error);
        return {
            answer: `Произошла ошибка при обработке запроса: ${error instanceof Error ? error.message : 'Unknown error'}`,
            sources: []
        };
    }
}
