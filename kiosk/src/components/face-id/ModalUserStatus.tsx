import {
  Dialog,
  DialogPanel,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import { Fragment, useEffect, useState } from "react";
import { X } from "lucide-react";
import { Session, User } from "@/models";
import { Logo } from "../Logo";
import { getFaceMatch, setUserLog } from "@/lib/faceid";
import Loading from "../Loading";
import { useDialog } from "@/context/dialog";
import FailedStatus from "./FailedStatus";
import StudentStatus from "./StudentStatus";
import EmployeeStatus from "./EmployeeStatus";
import { printReciept } from "@/lib/printer";

interface IModalUserStatus {
  onClose: () => void;
  capturedFace: Blob | null;
}

const ModalUserStatus = ({ onClose, capturedFace }: IModalUserStatus) => {
  const { alert } = useDialog();
  const [imageSource, setImageSource] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [isSpoof, setIsSpoof] = useState<boolean | null>(null);
  const [error, setError] = useState<[string, string] | null>(null);

  const initialized = async () => {
    if (!capturedFace) return;
    setIsActive(true);
    setIsLoading(true);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImageSource(reader.result as string);
    };
    reader.readAsDataURL(capturedFace);
    const { user, session, error, is_spoof } = await getFaceMatch(capturedFace);

    setError(error);
    setUser(user);
    setSession(session);
    setIsSpoof(is_spoof);
    setIsLoading(false);
  };

  const handleAction = async () => {
    if (!user) return;
    setIsLoading(true);
    const { employee, reference_id, error, debug } = await setUserLog(
      user.id,
      session?.is_active ? "TIME_OUT" : "TIME_IN"
    );

    // Log debug information for TIME_OUT actions
    if (debug) {
      console.log("Session Debug Info:", debug);
    }

    if (error) {
      alert({
        title: error[0],
        description: error[1],
        mode: "ERROR",
      });
      setIsLoading(false);
      return;
    }

    if (employee && reference_id) {
      printReciept(
        reference_id,
        session?.is_active ? "TIME-OUT" : "TIME-IN",
        user.id,
        user.middle_name
          ? `${user.first_name} ${user.middle_name.charAt(0)}. ${
              user.last_name
            }`
          : `${user.first_name} ${user.last_name}`,
        new Date()
          .toLocaleDateString("en-US", {
            month: "2-digit",
            day: "2-digit",
            year: "numeric",
          })
          .toUpperCase() +
          " (" +
          new Date()
            .toLocaleDateString("en-US", {
              weekday: "short",
            })
            .toUpperCase() +
          ")",
        new Date().toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        })
      );
    }

    await alert({
      title: session?.is_active ? "SESSION ENDED" : "SESSION STARTED",
      description: session?.is_active
        ? `Have a wonderful day!`.concat(
            employee
              ? "\n\nPlease get your receipt."
              : "\n\nAn SMS has been sent to your guardian."
          )
        : `Welcome!`.concat(
            employee
              ? "\n\nPlease get your receipt."
              : "\n\n An SMS has been sent to your guardian."
          ),

      mode: "SUCCESS",
      backdropOnClose: true,
      displayTime: 5000,
    });

    handleOnClose();

    setIsLoading(false);
  };

  const handleOnClose = () => {
    setUser(null);
    setSession(null);
    setIsSpoof(null);
    setIsActive(false);
    setError(null);
    onClose();
  };

  useEffect(() => {
    if (capturedFace) {
      initialized();
    } else {
      handleOnClose();
    }
  }, [capturedFace]);

  return (
    <Transition appear show={!!capturedFace} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={() => {}}>
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
        </TransitionChild>

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
            <DialogPanel className="relative min-w-3xl flex flex-row gap-4 transform overflow-hidden rounded-lg bg-background p-6 text-left align-middle shadow-xl transition-all">
              {imageSource && (
                <img
                  src={imageSource}
                  alt="Captured Face"
                  className="rounded contrast-90 brightness-110"
                />
              )}
              <div className="flex flex-col flex-1 justify-center">
                <div className="flex flex-row justify-between">
                  <div className="flex flex-row gap-2 items-center">
                    <Logo className="w-10 h-10" />
                    <p className="text-xl text-primary font-semibold">
                      EDUSCAN
                    </p>
                  </div>
                  <button onClick={onClose}>
                    <X className="h-8 w-8 text-primary" />
                  </button>
                </div>

                {isActive && (
                  <>
                    {isLoading ? (
                      <div className="flex-1 flex flex-col justify-center items-center">
                        <Loading />
                      </div>
                    ) : error || isSpoof || !user ? (
                      <FailedStatus error={error} isSpoof={isSpoof} />
                    ) : user.student ? (
                      <StudentStatus
                        user={user}
                        session={session}
                        isLoading={isLoading}
                        onAction={handleAction}
                      />
                    ) : user.employee ? (
                      <EmployeeStatus
                        user={user}
                        session={session}
                        isLoading={isLoading}
                        onAction={handleAction}
                      />
                    ) : null}
                  </>
                )}
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </Dialog>
    </Transition>
  );
};

export default ModalUserStatus;
