import { BaseLanguageModel } from "langchain/base_language";
import { ConversationalRetrievalQAChain } from "langchain/chains";
import { ChatPromptTemplate } from "langchain/prompts";
import { BaseMessage } from "langchain/schema";
import { VectorStore } from "langchain/vectorstores/base";

const SYSTEM_PROMPT = `Use the following pieces of context to answer the question at the end. If you don't know the answer, just say that you don't know, don't try to make up an answer.
----------
CONTEXT: {context}
----------`;

export async function executeWebpageRAG(
  streamingModel: BaseLanguageModel,
  nonStreamingModel: BaseLanguageModel,
  vectorStore: VectorStore,
  prompt: string,
  chatHistory: BaseMessage[],
  abortController: AbortController,
  handleNewTokenCallback: (token: string) => void
): Promise<void> {
  const chatPromptTemplate = ChatPromptTemplate.fromMessages([
    ["system", SYSTEM_PROMPT],
    ...chatHistory,
    ["human", "{question}"],
  ]);

  const chain = ConversationalRetrievalQAChain.fromLLM(
    streamingModel,
    vectorStore.asRetriever(),
    {
      returnSourceDocuments: true,
      qaChainOptions: {
        type: "stuff",
        prompt: chatPromptTemplate,
      },
      questionGeneratorChainOptions: {
        llm: nonStreamingModel,
      },
    }
  );

  await chain.call(
    {
      question: prompt,
      chat_history: chatHistory,
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
}
