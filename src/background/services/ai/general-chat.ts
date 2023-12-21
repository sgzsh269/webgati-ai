import { BaseLanguageModel } from "langchain/base_language";
import { ConversationChain } from "langchain/chains";
import { ConversationSummaryBufferMemory } from "langchain/memory";
import { ChatPromptTemplate, MessagesPlaceholder } from "langchain/prompts";

const SYSTEM_PROMPT =
  "The following is a friendly conversation between a human and an AI. The AI is talkative and provides lots of specific details from its context. If the AI does not know the answer to a question, it truthfully says it does not know.";

const chatPromptTemplate = ChatPromptTemplate.fromMessages([
  ["system", SYSTEM_PROMPT],
  new MessagesPlaceholder("history"),
  ["human", "{input}"],
]);

export async function executeGeneralChat(
  model: BaseLanguageModel,
  memory: ConversationSummaryBufferMemory,
  prompt: string,
  abortController: AbortController,
  onNewToken: (token: string) => void
): Promise<void> {
  const chain = new ConversationChain({
    llm: model,
    prompt: chatPromptTemplate,
    memory,
  });

  await chain.call(
    {
      input: prompt,
      signal: abortController.signal,
    },
    {
      callbacks: [
        {
          handleLLMNewToken(token: string) {
            if (token) {
              onNewToken(token);
            }
          },
        },
      ],
    }
  );
}
