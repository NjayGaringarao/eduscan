"use client";

import React, { useEffect, useRef, useState } from "react";
import UserForm, { UserFormRef } from "../user-form/UserForm";
import { cn } from "@/utils/style";
import Button from "../Button";
import {
  FormErrorProp,
  GuardianProp,
  OrganizationalProp,
  PersonalFormProp,
} from "../user-form/type";
import {
  defaultFormError,
  defaultGuardian,
  defaultOrganizational,
  defaultPersonalInfo,
} from "../user-form/default";
import * as userLib from "@/lib/user";
import { get as getUser } from "@/lib/user";
import { ExtendedUser } from "@/models";
import Box from "../container/Box";

interface IEditUser {
  userId: string;
  onUpdated?: () => void;
}

const EditUser = ({ userId, onUpdated }: IEditUser) => {
  // UI States
  const [error, setError] = useState<FormErrorProp>(defaultFormError);
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<ExtendedUser | null>(null);
  const [isModified, setIsModified] = useState(false);
  const formRef = useRef<UserFormRef>(null);

  // Form States
  const [personalForm, setPersonalForm] =
    useState<PersonalFormProp>(defaultPersonalInfo);
  const [organizationalForm, setOrganizationalForm] =
    useState<OrganizationalProp>(defaultOrganizational);
  const [guardianForm, setGuardianForm] =
    useState<GuardianProp>(defaultGuardian);
  const [facialEncoding, setFacialEncoding] = useState<number[] | null>(null);
  const [hasExistingFacialEncoding, setHasExistingFacialEncoding] =
    useState(false);

  const fetchUserHandle = async () => {
    setIsLoading(true);
    const { user, error } = await getUser(userId);
    if (error) alert(error);

    setUser(user);
    setIsLoading(false);
  };

  const clearHandle = () => {
    if (!user) return;

    // map user → personalForm
    setPersonalForm({
      first_name: user.first_name,
      middle_name: user.middle_name ?? "",
      last_name: user.last_name,
      sex: user.sex,
      birth_date: new Date(user.birth_date).toISOString().split("T")[0], // yyyy-mm-dd
      address: user.address ?? "",
    });

    // map user → organizationalForm
    if (user.student) {
      setOrganizationalForm({
        user_id: user.id,
        user_type: "STUDENT",
        student_department: user.student.department,
        student_program: user.student.program,
        employee_type: "",
        employee_division: "",
        employee_title: "",
        employee_contact_number: "",
      });
    } else if (user.employee) {
      setOrganizationalForm({
        user_id: user.id,
        user_type: "EMPLOYEE",
        employee_type: user.employee.type,
        employee_division: user.employee.division,
        employee_title: user.employee.title,
        employee_contact_number: user.employee.contact_number,
        student_department: "",
        student_program: "",
      });
    }

    // map user → guardianForm
    if (user.guardian) {
      setGuardianForm({
        first_name: user.guardian.first_name,
        middle_name: user.guardian.middle_name ?? "",
        last_name: user.guardian.last_name,
        sex: user.guardian.sex,
        address: user.guardian.address ?? "",
        contact_number: user.guardian.contact_number ?? "",
      });
    } else {
      setGuardianForm(defaultGuardian);
    }

    // facial encoding indicator
    setHasExistingFacialEncoding(user.has_facial_encoding ?? false);
    setFacialEncoding(null);

    formRef.current?.scrollToTop();
  };

  const updateUserHandle = async () => {
    if (!confirm("This will update the user.")) return;

    // map personalForm → user
    const user = {
      first_name: personalForm.first_name,
      middle_name: personalForm.middle_name,
      last_name: personalForm.last_name,
      sex: personalForm.sex,
      birth_date: personalForm.birth_date,
      address: personalForm.address,
    };

    // map organizationalForm → organizational
    let organizational:
      | {
          user_id: string;
          role: "EMPLOYEE";
          type: string;
          division: string;
          title: string;
          contact_number: string;
        }
      | {
          user_id: string;
          role: "STUDENT";
          department: string;
          program: string;
        };

    if (organizationalForm.user_type === "STUDENT") {
      organizational = {
        user_id: organizationalForm.user_id,
        role: "STUDENT",
        department: organizationalForm.student_department,
        program: organizationalForm.student_program,
      };
    } else {
      organizational = {
        user_id: organizationalForm.user_id,
        role: "EMPLOYEE",
        type: organizationalForm.employee_type,
        division: organizationalForm.employee_division,
        title: organizationalForm.employee_title,
        contact_number: organizationalForm.employee_contact_number,
      };
    }

    // map guardianForm → guardian (optional)
    const guardian =
      guardianForm.first_name || guardianForm.last_name
        ? {
            first_name: guardianForm.first_name,
            middle_name: guardianForm.middle_name,
            last_name: guardianForm.last_name,
            sex: guardianForm.sex,
            address: guardianForm.address,
            contact_number: guardianForm.contact_number,
          }
        : undefined;

    setIsLoading(true);
    // final call
    const facialEncodingPayload =
      facialEncoding !== null
        ? facialEncoding
        : hasExistingFacialEncoding
        ? undefined
        : null;

    const { error } = await userLib.update({
      user,
      organizational,
      guardian,
      facialEncoding: facialEncodingPayload,
    });

    if (error) {
      alert("❌ Failed to update user: " + error);
    } else {
      alert("✅ User update successfully!");
      await fetchUserHandle();
      onUpdated?.();
    }

    setIsLoading(false);
  };

  useEffect(() => {
    if (!user) {
      setIsModified(false);
      return;
    }

    // build canonical objects from `user`
    const basePersonal: PersonalFormProp = {
      first_name: user.first_name,
      middle_name: user.middle_name ?? "",
      last_name: user.last_name,
      sex: user.sex,
      birth_date: new Date(user.birth_date).toISOString().split("T")[0],
      address: user.address ?? "",
    };

    const baseOrganizational: OrganizationalProp = user.student
      ? {
          user_id: user.id,
          user_type: "STUDENT",
          student_department: user.student.department,
          student_program: user.student.program,
          employee_type: "",
          employee_division: "",
          employee_title: "",
          employee_contact_number: "",
        }
      : {
          user_id: user.id,
          user_type: "EMPLOYEE",
          employee_type: user.employee?.type ?? "",
          employee_division: user.employee?.division ?? "",
          employee_title: user.employee?.title ?? "",
          employee_contact_number: user.employee?.contact_number ?? "",
          student_department: "",
          student_program: "",
        };

    const baseGuardian: GuardianProp = user.guardian
      ? {
          first_name: user.guardian.first_name,
          middle_name: user.guardian.middle_name ?? "",
          last_name: user.guardian.last_name,
          sex: user.guardian.sex,
          address: user.guardian.address ?? "",
          contact_number: user.guardian.contact_number ?? "",
        }
      : defaultGuardian;

    const baseHasFacialEncoding = user.has_facial_encoding ?? false;

    // shallow compare JSON (simplest for forms)
    const modified =
      JSON.stringify(personalForm) !== JSON.stringify(basePersonal) ||
      JSON.stringify(organizationalForm) !==
        JSON.stringify(baseOrganizational) ||
      JSON.stringify(guardianForm) !== JSON.stringify(baseGuardian) ||
      (facialEncoding ? true : hasExistingFacialEncoding) !==
        baseHasFacialEncoding;

    setIsModified(modified);
  }, [
    personalForm,
    organizationalForm,
    guardianForm,
    facialEncoding,
    hasExistingFacialEncoding,
    user,
  ]);

  useEffect(() => {
    clearHandle();
  }, [user]);

  useEffect(() => {
    fetchUserHandle();
  }, [userId]);

  return (
    <div className="relative flex-1 flex flex-col overflow-hidden">
      <div className="flex flex-1 overflow-y-scroll">
        <UserForm
          isLoading={isLoading}
          setIsLoading={setIsLoading}
          ref={formRef}
          isEditing
          error={error}
          setError={setError}
          personalForm={personalForm}
          setPersonalForm={setPersonalForm}
          organizationalForm={organizationalForm}
          setOrganizationalForm={setOrganizationalForm}
          guardianForm={guardianForm}
          setGuardianForm={setGuardianForm}
          facialEncoding={facialEncoding}
          setFacialEncoding={setFacialEncoding}
          hasExistingFacialEncoding={hasExistingFacialEncoding}
          onClearExistingFacialEncoding={() => {
            setHasExistingFacialEncoding(false);
            setFacialEncoding(null);
          }}
        />
      </div>

      <Box
        containerClassName={cn(
          "bg-background/70 backdrop-blur-lg border border-primary/20",
          "flex flex-row items-center justify-end gap-4",
          "rounded-none border-b-0 border-x-0"
        )}
      >
        <Button
          title="Submit"
          className="w-32"
          disabled={!!error.type || isLoading || !isModified}
          onClick={updateUserHandle}
        />
        <Button
          title="Reset"
          className="w-32"
          disabled={isLoading || !isModified}
          onClick={clearHandle}
          secondary
        />
      </Box>
    </div>
  );
};

export default EditUser;
