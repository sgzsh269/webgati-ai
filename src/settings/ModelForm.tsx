import React from "react";
import { Box, Button, Grid, Stack, Select, Text } from "@mantine/core";
import { useForm } from "@mantine/form";
import { showNotification } from "@mantine/notifications";
import { useEffect } from "react";
import {
  AI_MODEL_CONFIG_DEFAULT,
  MODEL_PROVIDER_ANTHROPIC,
  MODEL_PROVIDER_OLLAMA,
  MODEL_PROVIDER_OPENAI,
} from "../utils/constants";
import { ModelProvider } from "../utils/types";
import { readAIModelConfig, saveAIModelConfig } from "../utils/storage";
import { ModelFormFields } from "./ModelFormFields";
import { OpenAIFormFields } from "./OpenAIFormFields";
import { AnthropicFormFields } from "./AnthropicFormFields";
import { OllamaFormFields } from "./OllamaFormFields";

export function ModelForm(): JSX.Element {
  const [modelProvider, setModelProvider] = React.useState<ModelProvider>();

  const form = useForm({
    initialValues: {},
  });

  const loadModelConfig = async () => {
    const aiModelConfig = await readAIModelConfig();
    form.setValues(aiModelConfig || AI_MODEL_CONFIG_DEFAULT);
  };

  const handleSubmit = async () => {
    await saveAIModelConfig(form.values);
    showNotification({
      message: "AI Model config saved!",
    });
  };

  useEffect(() => {
    loadModelConfig();
  }, []);

  return (
    <Box>
      <Grid>
        <Grid.Col span={4}>
          <Stack spacing="sm">
            <Text weight="bold">
              NOTE: Make sure to click &apos;Save&apos; at the bottom after
              making changes
            </Text>
            <Select
              label="Configure Model Provider"
              placeholder="Configure Model Provider"
              data={[
                { value: MODEL_PROVIDER_OPENAI, label: "OpenAI" },
                { value: MODEL_PROVIDER_ANTHROPIC, label: "Anthropic" },
                { value: MODEL_PROVIDER_OLLAMA, label: "[Local] Ollama" },
              ]}
              value={modelProvider}
              onChange={(value: ModelProvider) => {
                setModelProvider(value);
              }}
              required
            />
            <form onSubmit={form.onSubmit(handleSubmit)}>
              {modelProvider === MODEL_PROVIDER_OPENAI && (
                <ModelFormFields
                  form={form}
                  modelProvider={MODEL_PROVIDER_OPENAI}
                  FormFieldsComponent={OpenAIFormFields}
                />
              )}
              {modelProvider === MODEL_PROVIDER_ANTHROPIC && (
                <ModelFormFields
                  form={form}
                  modelProvider={MODEL_PROVIDER_ANTHROPIC}
                  FormFieldsComponent={AnthropicFormFields}
                />
              )}
              {modelProvider === MODEL_PROVIDER_OLLAMA && (
                <ModelFormFields
                  form={form}
                  modelProvider={MODEL_PROVIDER_OLLAMA}
                  FormFieldsComponent={OllamaFormFields}
                />
              )}

              {modelProvider && (
                <Button type="submit" sx={{ marginTop: "16px", width: "100%" }}>
                  Save
                </Button>
              )}
            </form>
          </Stack>
        </Grid.Col>
      </Grid>
    </Box>
  );
}
