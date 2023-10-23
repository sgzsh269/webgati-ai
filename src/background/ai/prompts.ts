import { PromptTemplate } from "langchain/prompts";

const summaryPromptTemplate = `Your are an assistant tasked to generate dense and concise summaries from various types of content. You have been provided with content that needs to be summarized below.

To generate dense and concise summaries, use the following guidelines
- Understand the important entities and their context in the content.
- To make it dense, do not include unnecessary verbose phrases such as "The content mentions", "The speaker discusses", etc.
- Summary should always be in markdown-style bullet points, each bullet point should be less than 25 words, ensure each bullet point captures a unique insight.

## Content
{content}

## SUMMARY`;

export const AGENT_SYSTEM_PROMPT = `You are an intelligent agent who has access to certain tools and relevant content to help you answer any question.
- Answer the questions to the best of your ability, and use the tools at your disposal to help you.
- When the user mentions "this", they are referring to the content you already have access to
- When the user prompts using selected text in the format "Selected Text:\n$text\n Instructions:\n$instructions", you should assume it is related to the provided content and so always use the entire selected text and follow the instructions to answer the question.
- **DO NOT* make up any information or tool, only answer if you are confident you have the right answer.`;

export const SUMMARY_PROMPT = new PromptTemplate({
  template: summaryPromptTemplate,
  inputVariables: ["content"],
});
