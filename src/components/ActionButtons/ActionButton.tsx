import React from "react";
import { Button, Notification, Stack } from "@mantine/core";
import { useTimeout } from "@mantine/hooks";
import { useEffect, useState } from "react";

interface ActionButtonProps {
  label: string;
  onClick: () => void;
  notificationMessage: string;
  isLoading: boolean;
  errorMessage?: string;
  color?: string;
  disabled?: boolean;
}

export function ActionButton({
  label,
  onClick,
  notificationMessage,
  isLoading,
  errorMessage = "",
  color = "teal",
  disabled = false,
}: ActionButtonProps): JSX.Element {
  const [showNotification, setShowNotification] = useState(false);
  const [prevLoadingState, setPrevLoadingState] = useState(false);
  const { start, clear } = useTimeout(() => closeNotification(), 4000);

  useEffect(() => {
    if (showNotification) {
      start();
    }
  }, [showNotification, start]);

  useEffect(() => {
    if (isLoading && !prevLoadingState) {
      setShowNotification(false);
    } else if (!isLoading && prevLoadingState) {
      setShowNotification(true);
    }
    setPrevLoadingState(isLoading);
  }, [isLoading, prevLoadingState]);

  const closeNotification = () => {
    setShowNotification(false);
    clear();
  };

  return (
    <Stack spacing="xs">
      <Button
        color={color}
        onClick={onClick}
        loading={isLoading}
        size="xs"
        disabled={disabled}
      >
        {label}
      </Button>
      {showNotification && (
        <Notification
          color={errorMessage ? "red" : "teal"}
          onClose={closeNotification}
        >
          {errorMessage || notificationMessage}
        </Notification>
      )}
    </Stack>
  );
}
