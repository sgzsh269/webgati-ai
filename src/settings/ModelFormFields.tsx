import React from "react";
import { useEffect } from "react";

import { ModelProvider } from "../utils/types";
import { readModelProviderConfig } from "../utils/storage";
import { Stack } from "@mantine/core";
import { ModelFormFieldSet } from "./ModelFormFieldSet";

interface ModelFormFieldsProps {
  form: any;
  modelProvider: ModelProvider;
  FormFieldsComponent: React.FC<{ form: any; modelProvider: ModelProvider }>;
}

export function ModelFormFields({
  form,
  modelProvider,
  FormFieldsComponent,
}: ModelFormFieldsProps): JSX.Element {
  const loadModelConfig = async () => {
    const modelConfig = await readModelProviderConfig(modelProvider);

    if (!modelConfig) {
      return;
    }

    for (const [key, value] of Object.entries(modelConfig)) {
      form.setFieldValue(`${modelProvider}.${key}`, value);
    }
  };

  useEffect(() => {
    loadModelConfig();
  }, []);

  return (
    <Stack>
      <FormFieldsComponent form={form} modelProvider={modelProvider} />
      <ModelFormFieldSet form={form} modelProvider={modelProvider} />
    </Stack>
  );
}
