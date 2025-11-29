import { cn } from "@/utils/style";

interface IButton {
  title?: string;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
  secondary?: boolean;
  children?: React.ReactNode;
}
const Button = ({
  title,
  className,
  onClick,
  disabled,
  secondary = false,
  children,
}: IButton) => {
  return (
    <button
      type="button"
      className={cn(
        "p-1 md:px-4 rounded-lg shadow-lg",
        "hover:shadow-[0_0_4px_1px_var(--tw-shadow-color)] hover:shadow-primary/70 hover:scale-102 ",
        "transition-all transform duration-200",
        "text-base font-semibold",
        "flex flex-row gap-2 items-center justify-center",
        "border border-primary",
        disabled ? "opacity-50" : "opacity-100",
        secondary
          ? "bg-transparent text-primary"
          : "bg-primary text-background",
        className
      )}
      onClick={onClick}
      disabled={disabled}
    >
      {children && children}
      {title && title}
    </button>
  );
};

export default Button;
