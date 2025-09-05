"use client";

import React, { useState } from "react";
import UserForm from "../user-form/UserForm";
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
import * as userDB from "@/database/user";

const CreateUser = () => {
  // UI States
  const [error, setError] = useState<FormErrorProp>(defaultFormError);
  const [isLoading, setIsLoading] = useState(false);

  // Form States
  const [personalForm, setPersonalForm] =
    useState<PersonalFormProp>(defaultPersonalInfo);
  const [organizationalForm, setOrganizationalForm] =
    useState<OrganizationalProp>(defaultOrganizational);
  const [guardianForm, setGuardianForm] =
    useState<GuardianProp>(defaultGuardian);
  const [facialEncoding, setFacialEncoding] = useState<number[] | null>(null);

  const clearHandle = () => {
    setFacialEncoding(null);
    setPersonalForm(defaultPersonalInfo);
    setOrganizationalForm(defaultOrganizational);
    setGuardianForm(defaultGuardian);
  };

  const createUserHandle = async () => {
    if (!confirm("This will create a new user.")) return;

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
        contact_number: "", // ← do you want to reuse guardian contact # or add a separate employee contact?
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
    const { error } = await userDB.create({
      user,
      organizational,
      guardian,
      facialEncoding,
    });

    if (error) {
      alert("❌ Failed to create user: " + error);
    } else {
      alert("✅ User created successfully!");
      clearHandle();
    }

    setIsLoading(false);
  };

  return (
    <div className="relative h-full w-full flex flex-col gap-4">
      <UserForm
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
      />

      <div
        className={cn(
          "relative max-w-full rounded-xl p-4",
          "bg-background/70 backdrop-blur-lg border border-primary/20",
          "flex flex-row justify-end gap-4"
        )}
      >
        <Button
          title="Submit"
          className="w-32"
          disabled={!!error.type || isLoading || !facialEncoding}
          onClick={createUserHandle}
        />
        <Button
          title="Clear"
          className="w-32"
          disabled={isLoading}
          onClick={clearHandle}
          secondary
        />
      </div>
    </div>
  );
};

export default CreateUser;
