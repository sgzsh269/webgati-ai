import React from "react";
import { Box, Stack, Sx } from "@mantine/core";
import { CopyWebpageMarkdown } from "./ActionButtons/CopyWebpageMarkdown";
import { AnalyzeWebpage } from "./ActionButtons/AnalyzeWebpage";
import { SummarizeWebPage } from "./ActionButtons/SummarizeWebpage";
import { QueryMode } from "../utils/types";
import { StartPageSnipTool } from "./ActionButtons/StartPageSnipTool";
import { PageCapture } from "./ActionButtons/PageCapture";

interface ActionListProps {
  sx?: Sx;
  queryMode: QueryMode;
}

export function ActionList({ sx, queryMode }: ActionListProps): JSX.Element {
  return (
    <Box sx={sx}>
      <Stack spacing="xs">
        {queryMode === "webpage-text-qa" && (
          <>
            <AnalyzeWebpage />
            <CopyWebpageMarkdown />
            <SummarizeWebPage />
          </>
        )}
        {queryMode === "webpage-vqa" && (
          <>
            <PageCapture />
            <StartPageSnipTool />
          </>
        )}
      </Stack>
    </Box>
  );
}
