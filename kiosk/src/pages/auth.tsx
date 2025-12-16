import { useState } from "react";
import TextBox from "../components/TextBox";
import Button from "../components/Button";
import { cn } from "@/utils/style";
import { useAuth } from "@/context/auth";
import { Logo } from "@/components/Logo";

export const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { signIn } = useAuth();

  const signInHandle = async () => {
    try {
      setIsLoading(true);
      const { error } = await signIn(email, password);

      if (error) {
        alert(error);
      }
    } catch (error) {
      console.log("components.auth.SignIn.signInHandle :: ", error);
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <div
      className={cn(
        "flex items-center justify-center",
        "w-screen h-screen bg-background overflow-y-auto"
      )}
    >
      <img
        src={"/image/prmsu-foreground.png"}
        alt="PRMSU Logo"
        className="w-full h-full dark:opacity-10"
        style={{ objectFit: "cover" }}
      />
      <div className="absolute flex-1  h-full w-full bg-background/30 dark:bg-transparent"></div>
      <div
        className={cn(
          "absolute w-full rounded-xl p-8 max-w-212",
          "bg-background/80 backdrop-blur-sm",
          "flex flex-col gap-8"
        )}
      >
        <div
          className={cn(
            "bg-background rounded-md p-6",
            "shadow-sm shadow-textBody",
            "flex flex-row justify-center items-center gap-4 md:gap-0"
          )}
        >
          <Logo className="w-28 md:w-52" />
          <h1 className="text-primary text-5xl md:text-7xl font-bold mb-2 -ml-2">
            EDUSCAN
          </h1>
        </div>
        <div className={cn("min-w-44 h-auto w-full", "flex flex-col gap-4")}>
          <p
            className={cn(
              "text-primary/80 text-3xl md:text-4xl font-semibold focus:text-background focus:bg-text-body/80"
            )}
          >
            Kiosk Application
          </p>

          <div className="grid grid-cols-2 gap-4">
            <TextBox
              title="Service Address"
              value={email}
              setValue={setEmail}
              containerClassName="flex-1"
            />
            <TextBox
              title="Password"
              value={password}
              setValue={setPassword}
              containerClassName="flex-1"
              isPassword
            />
          </div>
          <Button
            title="Sign in"
            onClick={signInHandle}
            className="self-end w-full md:w-48 py-2"
            disabled={isLoading || password.length < 8}
          />
        </div>
      </div>
    </div>
  );
};
