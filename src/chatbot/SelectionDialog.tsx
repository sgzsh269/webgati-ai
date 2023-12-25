import ReactDOM from "react-dom/client";
import {
  Accordion,
  ActionIcon,
  Box,
  Button,
  Card,
  Group,
  MantineProvider,
  Stack,
  Text,
  createEmotionCache,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useForm } from "@mantine/form";
import React, { useRef } from "react";
import { IconAsterisk, IconX } from "@tabler/icons-react";
import {
  EXTENSION_Z_INDEX,
  SELECTION_DIALOG_ROOT_ID,
  SELECTION_DIALOG_SHADOW_ROOT_ID,
} from "../utils/constants";
import { QuestionTextArea } from "../components/QuestionTextArea";
import { useClickOutside } from "@mantine/hooks";
import { globalTheme } from "../utils/theme";
import { getSelectedTextPosition } from "../utils/ui";

export function renderSelectionDialog(
  selection: ReturnType<typeof getSelectedTextPosition>,
  onSubmit: (prompt: string) => void,
  onClose: () => void
): void {
  const selectionDialogRoot = document.createElement(SELECTION_DIALOG_ROOT_ID);
  selectionDialogRoot.id = SELECTION_DIALOG_ROOT_ID;

  document.documentElement.appendChild(selectionDialogRoot);

  const selectionDialogShadowRoot = selectionDialogRoot.attachShadow({
    mode: "open",
  });
  const selectionDialogShadowRootDiv = document.createElement("div");
  selectionDialogShadowRootDiv.style.height = "100%";

  const selectionMenuEmotionRoot = document.createElement("div");

  selectionDialogShadowRootDiv.id = SELECTION_DIALOG_SHADOW_ROOT_ID;
  selectionDialogShadowRoot.appendChild(selectionMenuEmotionRoot);
  selectionDialogShadowRoot.appendChild(selectionDialogShadowRootDiv);

  const selectionMenuMantineCache = createEmotionCache({
    key: "mantine-shadow",
    container: selectionMenuEmotionRoot,
  });

  ReactDOM.createRoot(selectionDialogShadowRootDiv).render(
    <MantineProvider
      theme={globalTheme}
      emotionCache={selectionMenuMantineCache}
    >
      <SelectionDialog
        selection={selection}
        onSubmit={onSubmit}
        onClose={onClose}
      />
    </MantineProvider>
  );
}

interface SelectionDialogProps {
  selection: ReturnType<typeof getSelectedTextPosition>;
  onSubmit: (prompt: string) => void;
  onClose: () => void;
}

export function SelectionDialog({
  selection,
  onSubmit,
  onClose,
}: SelectionDialogProps): JSX.Element {
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

  React.useEffect(() => {
    window.addEventListener("keydown", closeOnEscapePress);
    return () => window.removeEventListener("keydown", closeOnEscapePress);
  }, []);

  const closeOnEscapePress = (event: KeyboardEvent) => {
    if (event.key === "Escape") {
      onClose();
    }
  };

  const handleSubmit = (values: any) => {
    onSubmit(values.question.trim());
  };

  const showDialog = () => {
    handlers.open();
  };

  const handleEnterKey = (event: any) => {
    event.preventDefault();
    form.validate();
    formRef.current?.requestSubmit();
  };

  return (
    <>
      {selection && (
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
      )}
    </>
  );
}
