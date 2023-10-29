import { initializeAgentExecutorWithOptions } from "langchain/agents";
import { DynamicStructuredTool } from "langchain/tools";
import { RetrievalQAChain } from "langchain/chains";
import { ConversationSummaryBufferMemory } from "langchain/memory";
import { VectorStore } from "langchain/vectorstores/base";
import { Document } from "langchain/document";
import { AGENT_SYSTEM_PROMPT } from "./prompts";
import { BaseLanguageModel } from "langchain/dist/base_language";
import { z } from "zod";

const retrieverInputSchema = z.object({
  query: z
    .string()
    .describe(
      "Rephrased query with importants details included from conversation history"
    ),
});
class AgentService {
  getRetrievalChainTool(
    installType: "development" | "normal",
    vectorStore: VectorStore,
    model: BaseLanguageModel,
    abortController: AbortController,
    handleNewTokenCallback: (token: string) => void
  ) {
    const retrievalChain = RetrievalQAChain.fromLLM(
      model,
      vectorStore.asRetriever(),
      {
        returnSourceDocuments: true,
      }
    );

    return new DynamicStructuredTool({
      name: "search_content",
      description:
        "This tool can answer questions about a particular page content which can be referred to as this",
      returnDirect: true,
      schema: retrieverInputSchema,
      func: async (input) => {
        const query = input.query;
        const response = await retrievalChain.call(
          {
            query,
            signal: abortController.signal,
          },
          {
            callbacks: [
              {
                handleLLMNewToken(token: string) {
                  handleNewTokenCallback(token);
                },
              },
            ],
          }
        );

        if (installType === "development") {
          console.log(
            "SOURCE DOCS:",
            response.sourceDocuments
              .map((d: Document) => d.pageContent)
              .join("\n\n")
          );
        }

        return response.text;
      },
    });
  }

  async executeAgent(
    installType: "development" | "normal",
    userPrompt: string,
    vectorStore: VectorStore,
    memory: ConversationSummaryBufferMemory,
    model: BaseLanguageModel,
    abortController: AbortController,
    handleNewTokenCallback: (token: string) => void
  ): Promise<void> {
    const retrievalChainTool = this.getRetrievalChainTool(
      installType,
      vectorStore,
      model,
      abortController,
      handleNewTokenCallback
    );

    const agentExecutor = await initializeAgentExecutorWithOptions(
      [retrievalChainTool],
      model,
      {
        agentType: "openai-functions",
        memory,
        verbose: installType === "development",
        agentArgs: {
          prefix: AGENT_SYSTEM_PROMPT,
        },
      }
    );

    await agentExecutor.call(
      {
        input: userPrompt,
        signal: abortController.signal,
      },
      {
        callbacks: [
          {
            handleLLMNewToken(token: string) {
              if (token) {
                handleNewTokenCallback(token);
              }
            },
          },
        ],
      }
    );
  }
}

export const agentService = new AgentService();
