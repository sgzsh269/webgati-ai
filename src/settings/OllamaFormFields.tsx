import React from "react";
import { Box, Stack, TextInput } from "@mantine/core";
import { ModelProvider } from "../utils/types";

interface OllamaFormFieldsProps {
  form: any;
  modelProvider: ModelProvider;
}

export const OllamaFormFields = ({
  form,
  modelProvider,
}: OllamaFormFieldsProps): JSX.Element => {
  return (
    <Box>
      <Stack spacing="sm">
        <TextInput
          label="Base URL"
          required
          {...form.getInputProps(`${modelProvider}.baseUrl`)}
        />
      </Stack>
    </Box>
  );
};
