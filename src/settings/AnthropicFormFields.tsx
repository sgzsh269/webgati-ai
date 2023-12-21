import React from "react";
import { Anchor, Box, PasswordInput, Stack } from "@mantine/core";
import { ModelProvider } from "../utils/types";

interface AnthropicFormFieldsProps {
  form: any;
  modelProvider: ModelProvider;
}

export const AnthropicFormFields = ({
  form,
  modelProvider,
}: AnthropicFormFieldsProps): JSX.Element => {
  return (
    <Box>
      <Stack spacing="sm">
        <PasswordInput
          label="Anthropic API Key"
          required
          {...form.getInputProps(`${modelProvider}.apiKey`)}
        />
        <Anchor
          href="https://docs.anthropic.com/claude/reference/getting-started-with-the-api"
          target="_blank"
          size="xs"
        >
          Get your own Anthropic API Key
        </Anchor>
      </Stack>
    </Box>
  );
};
