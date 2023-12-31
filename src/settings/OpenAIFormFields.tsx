import React from "react";
import { Anchor, Box, PasswordInput, Stack } from "@mantine/core";
import { ModelProvider } from "../utils/types";

interface OpenAIFormFieldsProps {
  form: any;
  modelProvider: ModelProvider;
}

export const OpenAIFormFields = ({
  form,
  modelProvider,
}: OpenAIFormFieldsProps): JSX.Element => {
  return (
    <Box>
      <Stack spacing="sm">
        <PasswordInput
          label="OpenAI API Key"
          required
          {...form.getInputProps(`${modelProvider}.apiKey`)}
        />
        <Anchor
          href="https://www.howtogeek.com/885918/how-to-get-an-openai-api-key/"
          target="_blank"
          size="xs"
        >
          Get your own OpenAI API Key
        </Anchor>
      </Stack>
    </Box>
  );
};
