import React, { useEffect } from "react";
import { CheckCircle, AlertCircle, X, Loader2 } from "lucide-react";
import { StickyNote } from "@/components/ui/sticky-note";

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

  const getStickyColor = () => {
    switch (type) {
      case "success":
        return "green";
      case "error":
        return "pink";
      case "processing":
        return "blue";
      default:
        return "yellow";
    }
  };

  const getIconColor = () => {
    switch (type) {
      case "success":
        return "text-green-700";
      case "error":
        return "text-red-700";
      case "processing":
        return "text-blue-700";
      default:
        return "text-yellow-700";
    }
  };

  const getIcon = () => {
    switch (type) {
      case "success":
        return <CheckCircle className={`h-5 w-5 ${getIconColor()}`} />;
      case "error":
        return <AlertCircle className={`h-5 w-5 ${getIconColor()}`} />;
      case "processing":
        return <Loader2 className={`h-5 w-5 ${getIconColor()} animate-spin`} />;
      default:
        return null;
    }
  };

  return (
    <StickyNote
      color={getStickyColor()}
      className="p-4 mb-3 animate-in slide-in-from-right transform rotate-1"
      style={{
        animationDuration: "300ms",
      }}
    >
      <div className="flex">
        <div className="flex-shrink-0">
          {getIcon()}
        </div>
        <div className="ml-3 flex-1 mr-2">
          <p className="text-sm font-medium text-gray-800">{message}</p>
        </div>
        <div className="pl-3">
          <button
            className="inline-flex text-gray-700 hover:text-gray-900 focus:outline-none"
            onClick={onDismiss}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </StickyNote>
  );
};
