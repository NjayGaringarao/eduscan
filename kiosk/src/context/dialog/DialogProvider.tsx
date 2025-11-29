import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import {
  createContext,
  useCallback,
  useState,
  Fragment,
  useRef,
  useEffect,
} from "react";
import { AlertTriangle, CheckCircle2, Info } from "lucide-react";
import clsx from "clsx";
import Button from "@/components/Button";
import {
  AlertMode,
  AlertOptions,
  ConfirmOptions,
  DialogContextType,
} from "@/types/dialog";

export const DialogContext = createContext<DialogContextType | null>(null);

export const DialogProvider = ({ children }: { children: React.ReactNode }) => {
  const [alertOptions, setAlertOptions] = useState<AlertOptions | null>(null);
  const [confirmOptions, setConfirmOptions] = useState<ConfirmOptions | null>(
    null
  );

  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const [resolveConfirm, setResolveConfirm] = useState<
    (value: boolean) => void
  >(() => () => {});
  const [resolveAlert, setResolveAlert] = useState<() => void>(() => () => {});

  const autoDismissTimeout = useRef<NodeJS.Timeout | null>(null);

  /** ALERT HANDLERS **/
  const alert = useCallback((opts: AlertOptions): Promise<void> => {
    return new Promise((resolve) => {
      setAlertOptions(opts);
      setIsAlertOpen(true);
      setResolveAlert(() => resolve);
    });
  }, []);

  const closeAlert = () => {
    setIsAlertOpen(false);
    setTimeout(() => setAlertOptions(null), 200);
  };

  const handleAlertConfirm = () => {
    resolveAlert();
    closeAlert();
  };

  const getAlertIcon = (mode: AlertMode = "INFO") => {
    const iconClass = clsx(
      "w-16 h-16 border rounded bg-opacity-5 flex-shrink-0",
      mode === "SUCCESS" && "text-background bg-uGreen",
      mode === "ERROR" && "text-background bg-uRed",
      mode === "INFO" && "text-background bg-primary"
    );

    switch (mode) {
      case "SUCCESS":
        return <CheckCircle2 className={iconClass} />;
      case "ERROR":
        return <AlertTriangle className={iconClass} />;
      default:
        return <Info className={iconClass} />;
    }
  };

  /** CONFIRM HANDLERS **/
  const confirm = useCallback((opts: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setConfirmOptions(opts);
      setIsConfirmOpen(true);
      setResolveConfirm(() => resolve);
    });
  }, []);

  const closeConfirm = () => {
    setIsConfirmOpen(false);
    setTimeout(() => setConfirmOptions(null), 200);
  };

  const handleConfirm = () => {
    resolveConfirm(true);
    closeConfirm();
  };

  const handleCancel = () => {
    resolveConfirm(false);
    closeConfirm();
  };

  /** AUTO-DISMISS ALERT **/
  useEffect(() => {
    if (isAlertOpen && typeof alertOptions?.displayTime === "number") {
      autoDismissTimeout.current = setTimeout(() => {
        resolveAlert();
        closeAlert();
      }, alertOptions.displayTime);
    }
    return () => {
      if (autoDismissTimeout.current) clearTimeout(autoDismissTimeout.current);
    };
  }, [isAlertOpen, alertOptions]);

  return (
    <DialogContext.Provider value={{ alert, confirm }}>
      {children}

      {/* ALERT MODAL */}
      <Transition appear show={isAlertOpen} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-50"
          onClose={() => {
            if (alertOptions?.backdropOnClose) {
              resolveAlert();
              closeAlert();
            }
          }}
        >
          {/* Backdrop */}
          <TransitionChild
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-150"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black opacity-90" />
          </TransitionChild>

          {/* Panel */}
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <TransitionChild
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <DialogPanel className="w-[26rem] transform overflow-hidden rounded-lg bg-background shadow-xl transition-all flex gap-4 p-4">
                <div>{getAlertIcon(alertOptions?.mode)}</div>
                <div className="flex flex-col flex-1">
                  <p
                    className={clsx(
                      "font-bold",
                      "text-xl md:text-2xl",
                      getAlertTextColor(alertOptions?.mode)
                    )}
                  >
                    {alertOptions?.title}
                  </p>
                  {alertOptions?.description && (
                    <p className="text-textBody text-base md:text-lg leading-snug">
                      {alertOptions.description}
                    </p>
                  )}
                  <Button
                    title={alertOptions?.confirmText || "Okay"}
                    onClick={handleAlertConfirm}
                    className="w-full py-2.5 text-base mt-4"
                  />
                </div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </Dialog>
      </Transition>

      {/* CONFIRM MODAL */}
      <Transition appear show={isConfirmOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => {}}>
          {/* Backdrop */}
          <TransitionChild
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-150"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black opacity-90" />
          </TransitionChild>

          {/* Panel */}
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <TransitionChild
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <DialogPanel className="w-[26rem] transform overflow-hidden rounded-lg bg-background shadow-xl transition-all p-4 gap-2 flex flex-col">
                <DialogTitle className="text-xl md:text-2xl font-bold text-primary">
                  {confirmOptions?.title}
                </DialogTitle>
                {confirmOptions?.description && (
                  <p className="text-textBody text-base md:text-lg leading-snug">
                    {confirmOptions.description}
                  </p>
                )}
                <div className="flex flex-row gap-4 justify-end mt-4">
                  <Button
                    title={confirmOptions?.confirmText || "Confirm"}
                    className={clsx(
                      "py-2.5 px-5 text-base",
                      confirmOptions?.mode === "CRITICAL"
                        ? "bg-uRed"
                        : "bg-primary"
                    )}
                    onClick={handleConfirm}
                  />
                  <Button
                    title={confirmOptions?.cancelText || "Cancel"}
                    secondary
                    className="py-2.5 px-5 text-base"
                    onClick={handleCancel}
                  />
                </div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </Dialog>
      </Transition>
    </DialogContext.Provider>
  );
};

/** Helper **/
function getAlertTextColor(mode: AlertMode = "INFO") {
  switch (mode) {
    case "SUCCESS":
      return "text-uGreen";
    case "ERROR":
      return "text-uRed";
    default:
      return "text-primary";
  }
}
