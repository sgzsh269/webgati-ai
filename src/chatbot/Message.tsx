import { ActionIcon, Box, CopyButton, Group } from "@mantine/core";
import ReactMarkdown from "react-markdown";
import React from "react";
import { IconCopy } from "@tabler/icons-react";
import remarkGfm from "remark-gfm";

interface MessageProps {
  role: "user" | "ai";
  content: string;
  ref?: React.Ref<HTMLDivElement>;
}

// eslint-disable-next-line react/display-name
export const Message = React.forwardRef<HTMLDivElement, MessageProps>(
  ({ role, content }: MessageProps, ref) => {
    return (
      <Box
        ref={ref}
        sx={(theme) => {
          return {
            borderRadius: theme.radius.sm,
            backgroundColor:
              role === "user" ? theme.colors.gray[2] : theme.colors.blue[1],
            padding: "8px",
          };
        }}
      >
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            p: ({ ...props }) => {
              return <p style={{ margin: "0px" }} {...props} />;
            },
          }}
        >
          {content}
        </ReactMarkdown>
        {role === "ai" && (
          <Group position="right">
            <CopyButton value={content}>
              {({ copy }) => (
                <ActionIcon variant="transparent" onClick={copy}>
                  <IconCopy size="20px" />
                </ActionIcon>
              )}
            </CopyButton>
          </Group>
        )}
      </Box>
    );
  }
);
