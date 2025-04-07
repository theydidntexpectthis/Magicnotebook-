import React, { useEffect } from "react";
import { CheckCircle, AlertCircle, X, Loader2 } from "lucide-react";

type NotificationType = "success" | "error" | "processing";

interface NotificationProps {
  type: NotificationType;
  message: string;
  onDismiss: () => void;
  autoHideDuration?: number;
}

export const Notification: React.FC<NotificationProps> = ({
  type,
  message,
  onDismiss,
  autoHideDuration = 5000,
}) => {
  useEffect(() => {
    if (type !== "processing") {
      const timer = setTimeout(() => {
        onDismiss();
      }, autoHideDuration);
      
      return () => clearTimeout(timer);
    }
  }, [type, onDismiss, autoHideDuration]);

  const getNotificationStyles = () => {
    switch (type) {
      case "success":
        return "border-l-4 border-success";
      case "error":
        return "border-l-4 border-danger";
      case "processing":
        return "border-l-4 border-warning";
      default:
        return "border-l-4 border-primary";
    }
  };

  const getIcon = () => {
    switch (type) {
      case "success":
        return <CheckCircle className="h-5 w-5 text-success" />;
      case "error":
        return <AlertCircle className="h-5 w-5 text-danger" />;
      case "processing":
        return <Loader2 className="h-5 w-5 text-warning animate-spin" />;
      default:
        return null;
    }
  };

  return (
    <div
      className={`notification bg-white ${getNotificationStyles()} rounded-lg shadow-lg p-4 mb-3 animate-in slide-in-from-right`}
      style={{
        animationDuration: "300ms"
      }}
    >
      <div className="flex">
        <div className="flex-shrink-0">
          {getIcon()}
        </div>
        <div className="ml-3 flex-1 mr-2">
          <p className="text-sm font-medium text-gray-900">{message}</p>
        </div>
        <div className="pl-3">
          <button
            className="inline-flex text-gray-400 hover:text-gray-500 focus:outline-none"
            onClick={onDismiss}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
