import React from "react";
import { Textarea } from "@mantine/core";

interface QuestionTextAreaProps {
  form: any;
  handleEnterKey: (event: KeyboardEvent) => void;
  label?: string;
  placeholder?: string;
  disableInput?: boolean;
  required?: boolean;
}

export function QuestionTextArea({
  form,
  handleEnterKey,
  label = "",
  placeholder = "Ask a question",
  disableInput = false,
  required = false,
}: QuestionTextAreaProps): JSX.Element {
  return (
    <Textarea
      label={label}
      placeholder={placeholder}
      minRows={2}
      onKeyDown={(event) => {
        if (event.key !== "Enter") {
          event.stopPropagation();
        } else {
          handleEnterKey(event as unknown as KeyboardEvent);
        }
      }}
      required={required}
      disabled={disableInput}
      {...form.getInputProps("question")}
    />
  );
}
