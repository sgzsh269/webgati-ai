import React, { useCallback, useEffect, useRef } from "react";
import {
  Accordion,
  ActionIcon,
  Box,
  Button,
  Card,
  Group,
  Stack,
  Text,
} from "@mantine/core";
import { useDisclosure, useClickOutside } from "@mantine/hooks";
import { useForm } from "@mantine/form";
import { IconAsterisk, IconX } from "@tabler/icons-react";
import { EXTENSION_Z_INDEX } from "../utils/constants";
import { QuestionTextArea } from "../common/QuestionTextArea";
import { getSelectedTextPosition } from "../utils/ui";

interface SelectionDialogProps {
  show: boolean;
  selection: ReturnType<typeof getSelectedTextPosition>;
  onSubmit: (prompt: string) => void;
  onClose: () => void;
}

export function SelectionDialog({
  show,
  selection,
  onSubmit,
  onClose,
}: SelectionDialogProps): JSX.Element | null {
  const [opened, handlers] = useDisclosure(false);
  const containerRef = useClickOutside(onClose, undefined, []);

  const formRef = useRef<HTMLFormElement>(null);
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
    if (opened && !show) {
      handlers.close();
      form.reset();
    }
  }, [show, handlers, form, opened]);

  const closeOnEscapePress = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    },
    [onClose]
  );

  const handleSubmit = (values: any) => {
    const prompt = generateSelectionDialogPrompt(
      selection?.text || "",
      values.question.trim()
    );
    onSubmit(prompt);
  };

  const showDialog = () => {
    handlers.open();
  };

  const handleEnterKey = (event: any) => {
    event.preventDefault();
    form.validate();
    formRef.current?.requestSubmit();
  };

  useEffect(() => {
    window.addEventListener("keydown", closeOnEscapePress);
    return () => window.removeEventListener("keydown", closeOnEscapePress);
  }, [closeOnEscapePress]);

  if (!show || !selection) {
    return null;
  }

  return (
    <Box
      ref={containerRef}
      sx={{
        position: "absolute",
        top: `${selection.bottom}px`,
        left: `${selection.left}px`,
        zIndex: EXTENSION_Z_INDEX + 1,
        fontFamily: "arial, sans-serif",
        fontSize: "16px",
      }}
    >
      {opened && (
        <Card
          w="480px"
          shadow="lg"
          radius="md"
          p="md"
          sx={(theme) => {
            return {
              borderColor:
                theme.colors[theme.primaryColor][theme.primaryShade as any],
            };
          }}
          withBorder
        >
          <Stack spacing="sm">
            <Group h="16px" position="right">
              <ActionIcon onClick={onClose} color="dark">
                <IconX size="16px" />
              </ActionIcon>
            </Group>
            <Accordion variant="contained" chevronPosition="left">
              <Accordion.Item value="selectedText">
                <Accordion.Control>Selected Text</Accordion.Control>
                <Accordion.Panel>
                  <Box sx={{ maxHeight: "200px", overflow: "auto" }}>
                    <Text>{selection.text}</Text>
                  </Box>
                </Accordion.Panel>
              </Accordion.Item>
            </Accordion>

            <form ref={formRef} onSubmit={form.onSubmit(handleSubmit)}>
              <Stack spacing="xs">
                <QuestionTextArea
                  label="Ask AI to perform actions on the selected text"
                  placeholder=""
                  form={form}
                  handleEnterKey={handleEnterKey}
                  disableInput={false}
                  required
                />
                <Button type="submit">Submit</Button>
              </Stack>
            </form>
          </Stack>
        </Card>
      )}
      {!opened && (
        <ActionIcon onClick={showDialog} variant="filled" color="blue">
          <IconAsterisk size="20px" />
        </ActionIcon>
      )}
    </Box>
  );
}

const generateSelectionDialogPrompt = (
  selectedText: string,
  instructions: string
) => `**Selected Text:**\n${selectedText}\n**Instructions:**\n${instructions}`;
