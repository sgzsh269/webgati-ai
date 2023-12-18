import { ModelService, modelService } from "./model-service";
import { ConversationSummaryBufferMemory } from "langchain/memory";
import { VectorStore } from "langchain/vectorstores/base";
import { SWMessage } from "../../utils/types";
import { executeWebpageSummary } from "./webpage-summary";
import { executeWebpageRAG } from "./webpage-rag";
import { executeGeneralChat } from "./general-chat";
import { executeWebpageVisionChat } from "./webpage-vision";

class AIService {
  private modelService: ModelService;

  constructor(modelService: ModelService) {
    this.modelService = modelService;
  }

  async execute(
    installType: "development" | "normal",
    msg: SWMessage,
    vectorStore: VectorStore,
    memory: ConversationSummaryBufferMemory,
    abortController: AbortController,
    handleNewTokenCallback: (token: string) => void
  ) {
    const queryMode = msg.payload.queryMode;
    const prompt = msg.payload.prompt;

    const currentModel = this.modelService.getCurrentLLM(queryMode);
    const fasterModel = this.modelService.getOpenAI3Turbo();

    if (queryMode === "general") {
      await executeGeneralChat(
        currentModel,
        memory,
        prompt,
        abortController,
        handleNewTokenCallback
      );
    } else if (queryMode === "webpage-text-qa") {
      await executeWebpageRAG(
        fasterModel,
        currentModel,
        memory,
        vectorStore,
        prompt,
        abortController,
        handleNewTokenCallback
      );
    } else if (queryMode === "webpage-vqa") {
      await executeWebpageVisionChat(
        prompt,
        msg.payload.imageData,
        currentModel,
        abortController,
        memory,
        handleNewTokenCallback
      );
    } else if (queryMode === "summary") {
      await executeWebpageSummary(
        msg.payload.markdownContent,
        memory,
        currentModel,
        abortController,
        handleNewTokenCallback
      );
    }
  }
}

export const aiService = new AIService(modelService);
