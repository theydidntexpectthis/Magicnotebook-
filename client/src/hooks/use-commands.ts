import { useQuery } from "@tanstack/react-query";

export type CommandHistory = {
  id: number;
  command: string;
  serviceName: string;
  status: string;
  message: string;
  executedAt: string;
};

export function useCommands() {
  const { data: commandHistory = [], isLoading, error } = useQuery({
    queryKey: ["/api/commands/history"],
  });

  return {
    commandHistory,
    isLoading,
    error,
  };
}
