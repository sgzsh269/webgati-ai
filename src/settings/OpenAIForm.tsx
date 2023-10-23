import React, { useImperativeHandle } from "react";
import { Box, PasswordInput, Stack, Radio, Anchor } from "@mantine/core";
import { useEffect } from "react";
import { STORAGE_FIELD_OPENAI } from "../utils/constants";
import { ModelFormSubFormRef } from "../utils/types";
import {
  getModelProviderConfig,
  saveModelProviderConfig,
} from "../utils/storage";

interface OpenAIFormProps {
  form: any;
  ref?: React.ForwardedRef<ModelFormSubFormRef>;
}

function Form({ form, ref }: OpenAIFormProps): JSX.Element {
  const loadOpenAiApiKey = async () => {
    const openAIconfig = await getModelProviderConfig(STORAGE_FIELD_OPENAI);
    form.setFieldValue(`${STORAGE_FIELD_OPENAI}.apiKey`, openAIconfig?.apiKey);
    form.setFieldValue(
      `${STORAGE_FIELD_OPENAI}.modelName`,
      openAIconfig?.modelName || "gpt-3.5-turbo"
    );
  };

  const save = async () => {
    await saveModelProviderConfig(STORAGE_FIELD_OPENAI, {
      apiKey: form.values[STORAGE_FIELD_OPENAI].apiKey,
      modelName: form.values[STORAGE_FIELD_OPENAI].modelName,
    });
  };

  useEffect(() => {
    loadOpenAiApiKey();
  }, []);

  useImperativeHandle(ref, () => ({
    save,
  }));

  return (
    <Box>
      <Stack spacing="sm">
        <PasswordInput
          label="OpenAI API Key"
          required
          {...form.getInputProps(`${STORAGE_FIELD_OPENAI}.apiKey`)}
        />
        <Anchor
          href="https://www.howtogeek.com/885918/how-to-get-an-openai-api-key/"
          target="_blank"
          size="xs"
        >
          Get your own OpenAI API Key
        </Anchor>
        <Radio.Group
          orientation="vertical"
          label="Select Model"
          required
          {...form.getInputProps(`${STORAGE_FIELD_OPENAI}.modelName`)}
        >
          <Radio
            value="gpt-3.5-turbo"
            label="GPT-3.5 (Faster, cheaper but less capable)"
          />
          <Radio
            value="gpt-4"
            label="GPT-4 (More capable, but slower and more expensive"
          />
        </Radio.Group>
      </Stack>
    </Box>
  );
}

export const OpenAIForm = React.forwardRef<
  ModelFormSubFormRef,
  OpenAIFormProps
>((props, ref) => Form({ ...props, ref }));
OpenAIForm.displayName = "OpenAIForm";
