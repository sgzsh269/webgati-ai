import React, { useImperativeHandle } from "react";
import { useEffect } from "react";

import { ModelFormSubFormRef, ModelProvider } from "../utils/types";
import {
  readModelProviderConfig,
  saveModelProviderConfig,
} from "../utils/storage";

interface ModelFormFields {
  form: any;
  ref?: React.ForwardedRef<ModelFormSubFormRef>;
  modelProvider: ModelProvider;
  FormFieldsComponent: React.FC<{ form: any; modelProvider: ModelProvider }>;
}

function FormFields({
  form,
  ref,
  modelProvider,
  FormFieldsComponent,
}: ModelFormFields): JSX.Element {
  const loadModelConfig = async () => {
    const modelConfig = await readModelProviderConfig(modelProvider);

    if (!modelConfig) {
      return;
    }

    for (const [key, value] of Object.entries(modelConfig)) {
      form.setFieldValue(`${modelProvider}.${key}`, value);
    }
  };

  const save = async () => {
    await saveModelProviderConfig(modelProvider, form.values[modelProvider]);
  };

  useEffect(() => {
    loadModelConfig();
  }, []);

  useImperativeHandle(ref, () => ({
    save,
  }));

  return <FormFieldsComponent form={form} modelProvider={modelProvider} />;
}

export const ModelFormFields = React.forwardRef<
  ModelFormSubFormRef,
  ModelFormFields
>((props, ref) => FormFields({ ...props, ref }));
ModelFormFields.displayName = "ModelFormFields";
