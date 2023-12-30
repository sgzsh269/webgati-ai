import React, { useState } from "react";
import {
  Box,
  Button,
  Loader,
  Notification,
  Stack,
  Group,
  SegmentedControl,
  Image,
  Text,
  ActionIcon,
} from "@mantine/core";
import { QuestionTextArea } from "../common/QuestionTextArea";
import { useEffect, useRef } from "react";
import { useForm } from "@mantine/form";
import { Message } from "./Message";
import { useScrollIntoView } from "@mantine/hooks";
import { QueryMode, ModelConfig, ChatMessage } from "../utils/types";
import { IconX } from "@tabler/icons-react";

interface ChatUIProps {
  messages: ChatMessage[];
  isLoading: boolean;
  disableInput: boolean;
  error: string;
  queryMode: QueryMode;
  modelConfig: ModelConfig | null;
  imageData: string | null;
  setError: (error: string) => void;
  clearChatContext: () => void;
  processUserPrompt: (prompt: string) => Promise<void>;
  stopPromptProcessing: () => void;
  setQueryMode: (mode: QueryMode) => void;
  clearImageData: () => void;
}

export const ChatUI = ({
  messages,
  isLoading,
  disableInput,
  error,
  queryMode,
  modelConfig,
  imageData,
  setError,
  clearChatContext,
  processUserPrompt,
  stopPromptProcessing,
  setQueryMode,
  clearImageData,
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

  useEffect(() => {
    if (error) {
      setShowLoader(false);
    }
  }, [error]);

  const handleFormSubmit = async (values: { question: string }) => {
    form.reset();
    await processUserPrompt(values.question.trim());
  };

  const handleSegmentedControlChange = (value: QueryMode) => {
    setQueryMode(value);
    clearImageData();
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
                onChange={handleSegmentedControlChange}
                size="sm"
                color="blue"
                data={[
                  { label: "General", value: "general" },
                  { label: "Webpage", value: "webpage-text-qa" },
                  {
                    label: "Vision",
                    value: "webpage-vqa",
                    disabled: !modelConfig || !modelConfig.hasVision,
                  },
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
            {imageData && (
              <Box
                sx={{
                  width: "fit-content",
                  borderStyle: "solid",
                  borderWidth: "0.5px",
                }}
              >
                <ActionIcon onClick={clearImageData}>
                  <IconX size="16px" />
                </ActionIcon>
                <Image
                  width="100px"
                  height="100px"
                  fit="contain"
                  src={imageData}
                  withPlaceholder
                  placeholder={<Text>Image preview unavailable</Text>}
                />
              </Box>
            )}
          </Stack>
        </form>
      </Box>
    </Box>
  );
};
