import { User, Session } from "@/models";
import { MoveRight } from "lucide-react";
import Button from "../Button";
import { formatDate } from "@/utils/date";
import { useSessionTimer } from "@/hooks/useSessionTimer";

interface IEmployeeStatus {
  user: User;
  session: Session | null;
  isLoading: boolean;
  onAction: () => void;
}

const EmployeeStatus = ({
  user,
  session,
  isLoading,
  onAction,
}: IEmployeeStatus) => {
  const { sessionTime } = useSessionTimer(session?.arrival || null);

  return (
    <>
      <div className="flex-1 flex flex-col justify-center">
        <p className="text-base text-textBody font-mono">{user.id}</p>
        <p className="text-primary text-4xl shrink font-semibold">
          {user.first_name}
        </p>
        {user.middle_name && user.middle_name.length && (
          <p className="text-primary text-4xl shrink font-semibold">
            {user.middle_name}
          </p>
        )}
        <p className="text-primary text-4xl shrink font-semibold">
          {user.last_name}
        </p>

        {user.employee && (
          <div className="flex flex-row gap-2 items-center text-textBody mt-4">
            <span className="bg-textBody text-background text-base text-center border w-32 rounded-md">
              EMPLOYEE
            </span>
            <MoveRight className="text-primary text-lg" />
            <div>{user.employee.division}</div>
            <MoveRight className="text-primary text-lg" />
            <div>{user.employee.title}</div>
          </div>
        )}
      </div>
      <div className="bg-textBody/10 flex flex-row items-center justify-between p-2 rounded-sm">
        {session?.is_active ? (
          <div className="flex flex-col">
            <p className="text-lg text-textBody">CURRENTLY TIMED IN</p>
            <p className="text-sm text-textBody -mt-1">
              Session Time: {sessionTime}
            </p>
          </div>
        ) : (
          <div className="flex flex-col">
            <p className="text-lg text-textBody">CURRENTLY TIMED OUT</p>
            <p className="text-sm text-textBody -mt-1">
              {session &&
                session.departure &&
                `Since ${formatDate(session.departure)}`}
            </p>
          </div>
        )}

        <Button
          title={session?.is_active ? "TIME OUT" : "TIME IN"}
          onClick={onAction}
          disabled={isLoading}
          className="md:px-4"
        />
      </div>
    </>
  );
};

export default EmployeeStatus;
