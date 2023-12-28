import {
  ActionIcon,
  Box,
  CopyButton,
  Group,
  Popover,
  Text,
} from "@mantine/core";
import ReactMarkdown from "react-markdown";
import React, { useState } from "react";
import { IconCopy } from "@tabler/icons-react";
import remarkGfm from "remark-gfm";
import { useTimeout } from "@mantine/hooks";

interface MessageProps {
  role: "user" | "ai";
  content: string;
  ref?: React.Ref<HTMLDivElement>;
}

// eslint-disable-next-line react/display-name
export const Message = React.forwardRef<HTMLDivElement, MessageProps>(
  ({ role, content }: MessageProps, ref) => {
    const [copiedPopoverOpen, setCopiedPopoverOpen] = useState(false);
    const { start, clear } = useTimeout(
      () => setCopiedPopoverOpen(false),
      1000
    );

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
              return (
                <Text
                  component="p"
                  sx={{
                    marginTop: "4px",
                    marginBottom: "4px",
                    whiteSpace: "pre-wrap",
                  }}
                  {...props}
                />
              );
            },
          }}
        >
          {content}
        </ReactMarkdown>
        {role === "ai" && (
          <Group position="right">
            <CopyButton value={content}>
              {({ copy }) => (
                <Popover
                  position="left"
                  shadow="md"
                  opened={copiedPopoverOpen}
                  onChange={setCopiedPopoverOpen}
                >
                  <Popover.Target>
                    <ActionIcon
                      variant="transparent"
                      onClick={() => {
                        copy();
                        setCopiedPopoverOpen(true);
                        clear();
                        start();
                      }}
                    >
                      <IconCopy size="20px" />
                    </ActionIcon>
                  </Popover.Target>
                  <Popover.Dropdown sx={{ padding: "2px" }}>
                    <Text size="xs">Copied!</Text>
                  </Popover.Dropdown>
                </Popover>
              )}
            </CopyButton>
          </Group>
        )}
      </Box>
    );
  }
);
