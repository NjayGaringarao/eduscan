"use client";

import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import {
  FormErrorProp,
  PersonalFormProp,
  OrganizationalProp,
  GuardianProp,
} from "./type";
import TextBox from "../TextBox";
import DatePicker from "../DatePicker";
import { RadioGroup, RadioGroupItem } from "../RadioGroup";
import { cn } from "@/utils/style";
import {
  validateGuardianForm,
  validateOrganizationalForm,
  validatPersonalForm,
} from "./utils";
import { EmployeeType, roleOptions, StudentDepartment } from "@/constants/role";
import { getFacialEncoding } from "@/lib/user/getFacialEncoding";
import Button from "../Button";
import Loading from "../Loading";
import ModalCamera from "./facialEncoding/ModalCamera";

interface IUserForm {
  isEditing?: boolean;
  isLoading: boolean;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  error: FormErrorProp;
  setError: React.Dispatch<React.SetStateAction<FormErrorProp>>;
  personalForm: PersonalFormProp;
  setPersonalForm: React.Dispatch<React.SetStateAction<PersonalFormProp>>;
  organizationalForm: OrganizationalProp;
  setOrganizationalForm: React.Dispatch<
    React.SetStateAction<OrganizationalProp>
  >;
  guardianForm: GuardianProp;
  setGuardianForm: React.Dispatch<React.SetStateAction<GuardianProp>>;
  facialEncoding: number[] | null;
  setFacialEncoding: React.Dispatch<React.SetStateAction<number[] | null>>;
  hasExistingFacialEncoding?: boolean;
  onClearExistingFacialEncoding?: () => void;
}

export interface UserFormRef {
  scrollToTop: () => void;
}

const UserForm = forwardRef<UserFormRef, IUserForm>(
  (
    {
      isEditing = false,
      isLoading,
      setIsLoading,
      error,
      setError,
      personalForm,
      setPersonalForm,
      organizationalForm,
      setOrganizationalForm,
      guardianForm,
      setGuardianForm,
      facialEncoding,
      setFacialEncoding,
      hasExistingFacialEncoding = false,
      onClearExistingFacialEncoding,
    }: IUserForm,
    ref
  ) => {
    // UI States
    const [showCamera, setShowCamera] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useImperativeHandle(ref, () => ({
      scrollToTop: () => {
        if (containerRef.current) {
          containerRef.current.scrollTo({ top: 0, behavior: "smooth" });
        }
      },
    }));

    const handleCapture = async (blob: Blob) => {
      setIsLoading(true);
      setShowCamera(false);
      const formData = new FormData();
      formData.append("image", blob);

      const { error, matchedUserId, encoding } = await getFacialEncoding(blob);

      if (matchedUserId) {
        // A registered user was found - error message already contains this info
        alert(error || "ENCODING FAILED: Registered User found");
      } else if (error) {
        alert(error);
      } else if (encoding) {
        setFacialEncoding(encoding);
      }
      setIsLoading(false);
    };
    // #region Personal Info Form
    const personalInformationForm = () => {
      return (
        <div key="personal_info_form" className="w-full flex flex-col gap-4">
          <h4 id="personal" className="text-lg text-primary font-medium">
            I. PERSONAL INFORMATION
          </h4>
          <p className="pl-6 text-base text-primary/90 -mt-2">
            Please enter the user&apos;s personal information accurately. This
            will be used for user identification and records.
          </p>
          <div className="pl-2 md:pl-6 w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* First Name */}
            <div className="flex flex-col">
              <TextBox
                title="First Name"
                value={personalForm.first_name}
                placeHolder="JUAN"
                setValue={(e) =>
                  setPersonalForm((prev) => ({ ...prev, first_name: e }))
                }
                isUpperCase
                isRequired
                isValueInvalid={error.type === "personal.first_name"}
                disabled={isLoading}
              />
              {error.type === "personal.first_name" && (
                <div className="text-error text-sm font-light">
                  {error.message}
                </div>
              )}
            </div>

            {/* Middle Name (optional) */}
            <div className="flex flex-col">
              <TextBox
                title="Middle Name"
                value={personalForm.middle_name || ""}
                placeHolder="DELA CRUZ"
                setValue={(e) =>
                  setPersonalForm((prev) => ({ ...prev, middle_name: e }))
                }
                isUpperCase
                isValueInvalid={error.type === "personal.middle_name"}
                disabled={isLoading}
              />
              {error.type === "personal.middle_name" && (
                <div className="text-error text-sm font-light">
                  {error.message}
                </div>
              )}
            </div>

            {/* Last Name */}
            <div className="flex flex-col">
              <TextBox
                title="Last Name"
                value={personalForm.last_name}
                placeHolder="SANTOS"
                setValue={(e) =>
                  setPersonalForm((prev) => ({ ...prev, last_name: e }))
                }
                isUpperCase
                isRequired
                isValueInvalid={error.type === "personal.last_name"}
                disabled={isLoading}
              />
              {error.type === "personal.last_name" && (
                <div className="text-error text-sm font-light">
                  {error.message}
                </div>
              )}
            </div>

            {/* Date of Birth */}
            <div className="flex flex-col w-full">
              <DatePicker
                date={personalForm.birth_date}
                setDate={(e) =>
                  setPersonalForm((prev) => ({ ...prev, birth_date: e }))
                }
                disabled={isLoading}
                containerClassName="w-full"
                inputClassName="w-full"
              />
              {error.type === "personal.birthday" && (
                <div className="text-error text-sm font-light">
                  {error.message}
                </div>
              )}
            </div>

            {/* Sex */}
            <div className="flex flex-col">
              <RadioGroup
                id="user_sex"
                title="Sex"
                value={personalForm.sex}
                setValue={(e) =>
                  setPersonalForm((prev) => ({ ...prev, sex: e }))
                }
                className="flex flex-row"
                isValueInvalid={error.type === "user_sex"}
                isRequired
                disabled={isLoading}
              >
                {["MALE", "FEMALE"].map((s) => (
                  <div key={s} className="flex items-center gap-2">
                    <RadioGroupItem
                      value={s}
                      id={`user_sex-${s.toLowerCase()}`}
                    />
                    <label htmlFor={`user_sex-${s.toLowerCase()}`}>{s}</label>
                  </div>
                ))}
              </RadioGroup>
              {error.type === "user_sex" && (
                <div className="text-error text-sm font-light">
                  {error.message}
                </div>
              )}
            </div>

            {/* Address */}
            <div className="md:col-span-2 lg:col-span-3 flex flex-col">
              <TextBox
                title="Current Address"
                value={personalForm.address}
                placeHolder="125 MAGSAYSAY RD., SAN PABLO..."
                setValue={(e) =>
                  setPersonalForm((prev) => ({ ...prev, address: e }))
                }
                isUpperCase
                isRequired
                isValueInvalid={error.type === "personal.address"}
                disabled={isLoading}
              />
              {error.type === "personal.address" && (
                <div className="text-error text-sm font-light">
                  {error.message}
                </div>
              )}
            </div>
          </div>
        </div>
      );
    };

    //#region Student Fields
    const studentFields = () => {
      const studentDept =
        organizationalForm.student_department as StudentDepartment;

      return (
        <>
          {/* Department */}
          <div className="flex flex-col">
            <RadioGroup
              title="Department"
              value={organizationalForm.student_department}
              setValue={(val) =>
                setOrganizationalForm((prev) => ({
                  ...prev,
                  student_department: val,
                  student_program: "", // reset program when department changes
                }))
              }
              className="flex flex-wrap gap-4"
              isRequired
              isValueInvalid={
                error.type === "organizational.student_department"
              }
              disabled={isLoading}
            >
              {Object.keys(roleOptions.STUDENT.departments).map((dept) => (
                <div key={dept} className="flex items-center gap-2">
                  <RadioGroupItem value={dept} id={`dept-${dept}`} />
                  <label htmlFor={`dept-${dept}`}>{dept}</label>
                </div>
              ))}
            </RadioGroup>
            {error.type === "organizational.student_department" && (
              <p className="text-error text-sm font-light">
                * Please select a department.
              </p>
            )}
          </div>

          {/* Program */}
          <div className="flex flex-col">
            {!!studentDept && (
              <>
                <RadioGroup
                  title="Program"
                  value={organizationalForm.student_program}
                  setValue={(val) =>
                    setOrganizationalForm((prev) => ({
                      ...prev,
                      student_program: val,
                    }))
                  }
                  className="flex flex-wrap gap-4"
                  isRequired
                  isValueInvalid={
                    error.type === "organizational.student_program"
                  }
                  disabled={isLoading}
                >
                  {roleOptions.STUDENT.departments[
                    studentDept as StudentDepartment
                  ].map((prog) => (
                    <div key={prog} className="flex items-center gap-2">
                      <RadioGroupItem value={prog} id={`prog-${prog}`} />
                      <label htmlFor={`prog-${prog}`}>{prog}</label>
                    </div>
                  ))}
                </RadioGroup>
                {error.type === "organizational.student_program" && (
                  <p className="text-error text-sm font-light">
                    * Please select a program.
                  </p>
                )}
              </>
            )}
          </div>
        </>
      );
    };

    // #region Employee fields
    const employeeFields = () => {
      const empType =
        organizationalForm.employee_type as keyof typeof roleOptions.EMPLOYEE.types;
      const empDiv = organizationalForm.employee_division as EmployeeType;

      // Grab the right division map for the employee type
      const divisionMap = roleOptions.EMPLOYEE.types[empType]?.division ?? {};
      const titleOptions =
        empDiv && empDiv in divisionMap
          ? (divisionMap as Record<string, string[]>)[empDiv]
          : [];

      return (
        <>
          {/* Contact Number */}
          <div className="flex flex-col">
            <TextBox
              title="Contact Number"
              value={organizationalForm.employee_contact_number}
              placeHolder="09123456789"
              setValue={(e) =>
                setOrganizationalForm((prev) => ({
                  ...prev,
                  employee_contact_number: e,
                }))
              }
              isRequired
              isValueInvalid={
                error.type === "organizational.employee_contact_number"
              }
              disabled={isLoading}
            />
            {error.type === "organizational.employee_contact_number" && (
              <p className="text-error text-sm font-light">{error.message}</p>
            )}
          </div>
          {/* Employee Type */}
          <div className="flex flex-col">
            <RadioGroup
              title="Employee Type"
              value={organizationalForm.employee_type}
              setValue={(val) =>
                setOrganizationalForm((prev) => ({
                  ...prev,
                  employee_type: val,
                  employee_division: "",
                  employee_title: "",
                }))
              }
              className="flex flex-wrap gap-4"
              isRequired
              isValueInvalid={error.type === "organizational.employee_type"}
              disabled={isLoading}
            >
              {Object.keys(roleOptions.EMPLOYEE.types).map((type) => (
                <div key={type} className="flex items-center gap-2">
                  <RadioGroupItem value={type} id={`etype-${type}`} />
                  <label htmlFor={`etype-${type}`}>{type}</label>
                </div>
              ))}
            </RadioGroup>
            {error.type === "organizational.employee_type" && (
              <p className="text-error text-sm font-light">
                * Please select employee type.
              </p>
            )}
          </div>

          {/* Division */}

          {empType && (
            <div className="flex flex-col">
              <RadioGroup
                title="Division"
                value={organizationalForm.employee_division}
                setValue={(val) =>
                  setOrganizationalForm((prev) => ({
                    ...prev,
                    employee_division: val,
                    employee_title: "",
                  }))
                }
                className="flex flex-wrap gap-4"
                isRequired
                isValueInvalid={
                  error.type === "organizational.employee_division"
                }
                disabled={isLoading}
              >
                {Object.keys(divisionMap).map((div) => (
                  <div key={div} className="flex items-center gap-2">
                    <RadioGroupItem value={div} id={`div-${div}`} />
                    <label htmlFor={`div-${div}`}>{div}</label>
                  </div>
                ))}
              </RadioGroup>
              {error.type === "organizational.employee_division" && (
                <p className="text-error text-sm font-light">
                  * Please select a division.
                </p>
              )}
            </div>
          )}

          {/* Title */}
          {titleOptions.length > 0 && (
            <div className="flex flex-col">
              <RadioGroup
                title="Job Title"
                value={organizationalForm.employee_title}
                setValue={(val) =>
                  setOrganizationalForm((prev) => ({
                    ...prev,
                    employee_title: val,
                  }))
                }
                className="flex flex-wrap gap-4 md:col-span-2"
                isRequired
                isValueInvalid={error.type === "organizational.employee_title"}
                disabled={isLoading}
              >
                {titleOptions.map((pos) => (
                  <div key={pos} className="flex items-center gap-2">
                    <RadioGroupItem value={pos} id={`pos-${pos}`} />
                    <label htmlFor={`pos-${pos}`}>{pos}</label>
                  </div>
                ))}
              </RadioGroup>
              {error.type === "organizational.employee_title" && (
                <p className="text-error text-sm font-light">
                  * Please select a title.
                </p>
              )}
            </div>
          )}
        </>
      );
    };

    //#region Organizational Forms
    const organizationalInformationForm = () => {
      return (
        <div key="org_info_form" className="w-full flex flex-col gap-4">
          <h4 className="text-lg text-primary font-medium">
            II. ORGANIZATIONAL INFORMATION
          </h4>
          <p className="pl-2 md:pl-6 text-base text-primary/90 -mt-2  ">
            Please provide the valid User ID (Employee Number or Student Number)
            and accomplish the selections of role within the organization.
          </p>
          <div className="pl-2 md:pl-6 w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Role */}
            <RadioGroup
              id="user_role"
              title="User Type"
              value={organizationalForm.user_type}
              setValue={(e) =>
                setOrganizationalForm((prev) => ({
                  ...prev,
                  user_type: e as "STUDENT" | "EMPLOYEE",
                }))
              }
              className="flex flex-row"
              isValueInvalid={error.type === "role"}
              isRequired
              disabled={isLoading || isEditing}
            >
              {["STUDENT", "EMPLOYEE"].map((r) => (
                <div key={r} className="flex items-center gap-2">
                  <RadioGroupItem value={r} id={`user_role-${r}`} />
                  <label htmlFor={`user_role-${r}`}>{r.toUpperCase()}</label>
                </div>
              ))}
            </RadioGroup>

            {/* ID Number */}
            <div className="flex flex-col">
              <TextBox
                title={
                  organizationalForm.user_type.slice(0, 1) +
                  organizationalForm.user_type.slice(1).toLowerCase() +
                  " Number"
                }
                value={organizationalForm.user_id}
                placeHolder="XX-X-X-XXXX"
                setValue={(e) =>
                  setOrganizationalForm((prev) => ({ ...prev, user_id: e }))
                }
                isRequired
                isValueInvalid={error.type === "organizational.user_id"}
                disabled={isLoading || isEditing}
              />
              {error.type === "organizational.user_id" && (
                <div className="text-error text-sm font-light">
                  {error.message}
                </div>
              )}
            </div>
            {/* ⬇️ STUDENT branch */}
            {organizationalForm.user_type === "STUDENT" && studentFields()}
            {organizationalForm.user_type === "EMPLOYEE" && employeeFields()}
          </div>
        </div>
      );
    };

    //#region Guardian Form
    const guardianInformationForm = () => {
      return (
        <div key="guardian_form" className="w-full flex flex-col gap-4">
          <h4 className="text-lg text-primary font-medium">
            III. GUARDIAN INFORMATION
          </h4>
          <p className="pl-6 text-base text-primary/90 -mt-2">
            Provide details about the individual who will receive notifications
            whenever this student enters or exits the campus.
          </p>

          <div className="pl-2 md:pl-6 w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* First Name */}
            <div className="flex flex-col">
              <TextBox
                title="First Name"
                value={guardianForm.first_name}
                placeHolder="JUAN"
                setValue={(e) =>
                  setGuardianForm((prev) => ({ ...prev, first_name: e }))
                }
                isUpperCase
                isRequired
                isValueInvalid={error.type === "guardian.first_name"}
                disabled={isLoading}
              />
              {error.type === "guardian.first_name" && (
                <div className="text-error text-sm font-light">
                  {error.message}
                </div>
              )}
            </div>

            {/* Middle Name */}
            <div className="flex flex-col">
              <TextBox
                title="Middle Name"
                value={guardianForm.middle_name || ""}
                placeHolder="DELA CRUZ"
                setValue={(e) =>
                  setGuardianForm((prev) => ({ ...prev, middle_name: e }))
                }
                isUpperCase
                isValueInvalid={error.type === "guardian.middle_name"}
                disabled={isLoading}
              />
              {error.type === "guardian.middle_name" && (
                <div className="text-error text-sm font-light">
                  {error.message}
                </div>
              )}
            </div>

            {/* Last Name */}
            <div className="flex flex-col">
              <TextBox
                title="Last Name"
                value={guardianForm.last_name}
                placeHolder="SANTOS"
                setValue={(e) =>
                  setGuardianForm((prev) => ({ ...prev, last_name: e }))
                }
                isUpperCase
                isRequired
                isValueInvalid={error.type === "guardian.last_name"}
                disabled={isLoading}
              />
              {error.type === "guardian.last_name" && (
                <div className="text-error text-sm font-light">
                  {error.message}
                </div>
              )}
            </div>

            {/* Sex */}
            <div className="flex flex-col">
              <RadioGroup
                id="guardian_sex"
                title="Sex"
                value={guardianForm.sex}
                setValue={(e) =>
                  setGuardianForm((prev) => ({ ...prev, sex: e }))
                }
                className="flex flex-row"
                isValueInvalid={error.type === "guardian.sex"}
                isRequired
                disabled={isLoading}
              >
                {["MALE", "FEMALE"].map((s) => (
                  <div key={s} className="flex items-center gap-2">
                    <RadioGroupItem
                      value={s}
                      id={`guardian_sex-${s.toLowerCase()}`}
                    />
                    <label htmlFor={`guardian_sex-${s.toLowerCase()}`}>
                      {s}
                    </label>
                  </div>
                ))}
              </RadioGroup>
              {error.type === "guardian.sex" && (
                <div className="text-error text-sm font-light">
                  {error.message}
                </div>
              )}
            </div>

            {/* Contact Number */}
            <div className="flex flex-col">
              <TextBox
                title="Contact Number"
                value={guardianForm.contact_number}
                placeHolder="09123456789"
                setValue={(e) =>
                  setGuardianForm((prev) => ({ ...prev, contact_number: e }))
                }
                isRequired
                isValueInvalid={error.type === "guardian.contact_number"}
                disabled={isLoading}
              />
              {error.type === "guardian.contact_number" && (
                <div className="text-error text-sm font-light">
                  {error.message}
                </div>
              )}
            </div>

            {/* Address */}
            <div className="md:col-span-2 lg:col-span-3 flex flex-col">
              <TextBox
                title="Current Address"
                value={guardianForm.address}
                placeHolder="125 MAGSAYSAY RD., SAN PABLO..."
                setValue={(e) =>
                  setGuardianForm((prev) => ({ ...prev, address: e }))
                }
                isUpperCase
                isRequired
                isValueInvalid={error.type === "guardian.address"}
                disabled={isLoading}
              />
              {error.type === "guardian.address" && (
                <div className="text-error text-sm font-light">
                  {error.message}
                </div>
              )}
            </div>
          </div>
        </div>
      );
    };

    //#region Face Encoding
    const faceEncodingForm = () => {
      const hasAnyFacialEncoding =
        Boolean(facialEncoding) || hasExistingFacialEncoding;

      return (
        <div className="w-full flex flex-col gap-4">
          <h4 className="text-lg text-primary font-medium">
            {organizationalForm.user_type == "STUDENT" ? "IV. " : "III. "}FACE
            ENCODING
          </h4>
          <p className="pl-6 text-base text-primary/90 -mt-2">
            Capture User&apos;s Facial encoding through webcam. This will be
            used for facial recognition based premises log tracking.
          </p>

          <Button
            title={hasAnyFacialEncoding ? "Retake" : "Start"}
            className={cn(
              hasAnyFacialEncoding ? "border-primary/20" : "border-error",
              "w-1/3 self-end py-2"
            )}
            onClick={() => setShowCamera(true)}
            secondary
            disabled={isLoading}
          />

          <div className="flex flex-col gap-2">
            <p
              className={cn(
                "text-sm font-semibold",
                hasAnyFacialEncoding ? "text-uGreen" : "text-uRed"
              )}
            >
              {hasAnyFacialEncoding ? "REGISTERED" : "UNREGISTERED"}
            </p>

            {isEditing &&
              hasExistingFacialEncoding &&
              !facialEncoding &&
              onClearExistingFacialEncoding && (
                <Button
                  title="Remove Existing Encoding"
                  className="w-fit px-4"
                  onClick={onClearExistingFacialEncoding}
                  secondary
                  disabled={isLoading}
                />
              )}
          </div>

          {showCamera && (
            <ModalCamera
              onCapture={handleCapture}
              onCancel={() => setShowCamera(false)}
            />
          )}
        </div>
      );
    };

    //#region useEffect
    useEffect(() => {
      setError({ type: null, message: null });

      const personalFormError = validatPersonalForm(personalForm);
      if (personalFormError) {
        setError(personalFormError);
        return;
      }

      const organizationalFormError =
        validateOrganizationalForm(organizationalForm);
      if (organizationalFormError) {
        setError(organizationalFormError);
        return;
      }

      if (organizationalForm.user_type === "STUDENT") {
        const guardianFormError = validateGuardianForm(guardianForm);
        if (guardianFormError) {
          setError(guardianFormError);
          return;
        }
      }

      setError({ type: null, message: null });
    }, [personalForm, organizationalForm, guardianForm]);

    //#region Render
    return (
      <>
        <div
          ref={containerRef}
          className={cn(
            "relative max-w-full h-full rounded-xl p-6",
            "bg-background/70 backdrop-blur-lg border border-primary/20",
            "flex flex-col items-start gap-16",
            "overflow-y-auto"
          )}
        >
          {personalInformationForm()}
          {organizationalInformationForm()}
          {organizationalForm.user_type === "STUDENT" &&
            guardianInformationForm()}
          {faceEncodingForm()}
        </div>
        {isLoading && (
          <div
            className={cn(
              "absolute z-30 h-full w-full rounded-lg",
              "bg-background/10 backdrop-blur-xs",
              "flex flex-col items-center justify-center"
            )}
          >
            <Loading prompt="Please wait..." />
          </div>
        )}
      </>
    );
  }
);

UserForm.displayName = "UserForm";

export default UserForm;
