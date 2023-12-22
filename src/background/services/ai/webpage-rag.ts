import { BaseLanguageModel } from "langchain/base_language";
import { ConversationalRetrievalQAChain } from "langchain/chains";
import { ConversationSummaryBufferMemory } from "langchain/memory";
import { ChatPromptTemplate } from "langchain/prompts";
import { VectorStore } from "langchain/vectorstores/base";

const SYSTEM_PROMPT = `Use the following pieces of context to answer the question at the end. If you don't know the answer, just say that you don't know, don't try to make up an answer.
----------
CONTEXT: {context}
----------`;

export async function executeWebpageRAG(
  fasterModel: BaseLanguageModel,
  slowerModel: BaseLanguageModel,
  memory: ConversationSummaryBufferMemory,
  vectorStore: VectorStore,
  prompt: string,
  abortController: AbortController,
  handleNewTokenCallback: (token: string) => void
): Promise<void> {
  const history = await memory.chatHistory.getMessages();

  const chatPromptTemplate = ChatPromptTemplate.fromMessages([
    ["system", SYSTEM_PROMPT],
    ...history,
    ["human", "{question}"],
  ]);

  const chain = ConversationalRetrievalQAChain.fromLLM(
    slowerModel,
    vectorStore.asRetriever(),
    {
      returnSourceDocuments: true,
      qaChainOptions: {
        type: "stuff",
        prompt: chatPromptTemplate,
      },
      questionGeneratorChainOptions: {
        llm: fasterModel,
      },
    }
  );

  const result = await chain.call(
    {
      question: prompt,
      chat_history: await memory.chatHistory.getMessages(),
      signal: abortController.signal,
    },
    {
      callbacks: [
        {
          handleLLMNewToken(token: string) {
            if (abortController.signal.aborted) {
              return;
            }
            if (token) {
              handleNewTokenCallback(token);
            }
          },
        },
      ],
    }
  );
  memory.chatHistory.addAIChatMessage(result.text);
}
