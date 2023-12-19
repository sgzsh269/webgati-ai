import React, { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Center,
  Loader,
  Notification,
  Stack,
  Text,
  Group,
  SegmentedControl,
} from "@mantine/core";
import { QuestionTextArea } from "./QuestionTextArea";
import { useEffect, useRef } from "react";
import { useForm } from "@mantine/form";
import { Message } from "../chatbot/Message";
import { useScrollIntoView } from "@mantine/hooks";
import { handleSettingsClick } from "../utils/ui";
import { ModelProvider, QueryMode } from "../utils/types";

interface ChatUIProps {
  messages: { role: "user" | "ai"; content: string }[];
  modelProvider: ModelProvider | null;
  isLoading: boolean;
  disableInput: boolean;
  error: string;
  queryMode: QueryMode;
  setError: (error: string) => void;
  clearChatContext: () => void;
  processUserPrompt: (prompt: string) => Promise<void>;
  stopPromptProcessing: () => void;
  setQueryMode: (mode: QueryMode) => void;
}

export const ChatUI = ({
  messages,
  modelProvider,
  isLoading,
  disableInput,
  error,
  queryMode,
  setError,
  clearChatContext,
  processUserPrompt,
  stopPromptProcessing,
  setQueryMode,
}: ChatUIProps): JSX.Element => {
  const formRef = useRef<HTMLFormElement>(null);
  const [showLoader, setShowLoader] = useState(false);

  const { scrollIntoView, scrollableRef, targetRef } =
    useScrollIntoView<HTMLDivElement>({
      offset: 60,
    });

  const form = useForm({
    initialValues: {
      question: "",
    },
    validate: {
      question: (value) =>
        value.trim().length < 2 ? "Must have at least 2 characters" : null,
    },
  });

  useEffect(() => {
    if (messages.length === 0) return;

    setShowLoader(true);
    scrollIntoView();
  }, [messages, scrollIntoView]);

  useEffect(() => {
    if (showLoader) {
      scrollIntoView();
    }
  }, [showLoader, scrollIntoView]);

  const handleEnterKey = (event: KeyboardEvent) => {
    event.preventDefault();
    form.validate();
    formRef.current?.requestSubmit();
  };

  useEffect(() => {
    setShowLoader(isLoading);
  }, [isLoading]);

  const handleFormSubmit = async (values: { question: string }) => {
    form.reset();
    await processUserPrompt(values.question.trim());
  };

  return (
    <Box
      mt="8px"
      sx={{
        display: "flex",
        flex: 1,
        flexDirection: "column",
        boxSizing: "border-box",
        overflow: "hidden",
      }}
    >
      {!modelProvider && (
        <Center
          sx={{
            height: "100%",
            width: "100%",
          }}
        >
          <Alert
            title="OpenAI API Key Required"
            color="orange"
            sx={{
              width: "100%",
            }}
          >
            <Stack>
              <Text>Set OpenAI API Key</Text>
              <Button color="orange" onClick={handleSettingsClick}>
                Set OpenAI API Key
              </Button>
            </Stack>
          </Alert>
        </Center>
      )}
      <Stack
        mb="4px"
        pb="36px"
        spacing="xs"
        sx={{ flex: 1, overflow: "scroll" }}
        ref={scrollableRef}
      >
        {messages.map((message, index) => {
          if (!message.content) {
            return null;
          }
          return (
            <Message
              key={index}
              role={message.role}
              content={message.content}
            />
          );
        })}
        {showLoader && (
          <Box sx={{ textAlign: "center" }} ref={targetRef}>
            <Loader variant="dots" mb="8px" />
          </Box>
        )}
      </Stack>
      <Box
        sx={{
          textAlign: "center",
        }}
      >
        {error && (
          <Notification
            color="red"
            title="Error"
            onClose={() => setError("")}
            sx={{
              marginBottom: "8px",
            }}
          >
            {error}
          </Notification>
        )}
        <form ref={formRef} onSubmit={form.onSubmit(handleFormSubmit)}>
          <Stack spacing="xs">
            {isLoading ? (
              <Group position="center">
                <Button
                  variant="outline"
                  size="xs"
                  onClick={stopPromptProcessing}
                >
                  Stop
                </Button>
              </Group>
            ) : (
              <SegmentedControl
                value={queryMode}
                onChange={setQueryMode}
                size="sm"
                color="blue"
                data={[
                  { label: "General", value: "general" },
                  { label: "Webpage", value: "webpage-text-qa" },
                  { label: "Screenshot", value: "webpage-vqa" },
                ]}
              />
            )}
            <QuestionTextArea
              form={form}
              handleEnterKey={handleEnterKey}
              disableInput={disableInput}
              required
            />
            <Group>
              <Button
                size="xs"
                variant="outline"
                onClick={clearChatContext}
                disabled={disableInput}
              >
                Clear Chat
              </Button>
              <Button
                type="submit"
                disabled={disableInput}
                size="xs"
                sx={{ flex: 1 }}
              >
                Send
              </Button>
            </Group>
          </Stack>
        </form>
      </Box>
    </Box>
  );
};
