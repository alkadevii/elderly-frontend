"use client";

import PhoneInputLib, { isPossiblePhoneNumber } from "react-phone-number-input";
import "react-phone-number-input/style.css";

type Props = {
  value?: string;
  onChange?: (value: string | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
};

export default function PhoneInput({
  value,
  onChange,
  placeholder = "Phone number",
  disabled = false,
}: Props) {
  const handleChange = onChange || (() => {});
  return (
    <>
      <style>{`
        .custom-phone-input {
          --PhoneInputCountrySelect-marginRight: 4px;
          --PhoneInputCountryFlag-height: 16px;
        }
        .custom-phone-input .PhoneInputInput {
          height: 40px;
          font-size: 16px;
          border: 1px solid #d9d9d9;
          border-radius: 6px;
          padding: 4px 11px;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
          width: 100%;
        }
        .custom-phone-input .PhoneInputInput:focus {
          border-color: #4A90E2;
          box-shadow: 0 0 0 2px rgba(74,144,226,0.2);
        }
        .custom-phone-input .PhoneInputInput:hover {
          border-color: #4A90E2;
        }
        .custom-phone-input .PhoneInputCountry {
          padding: 0 4px;
        }
      `}</style>
      <div className="custom-phone-input" style={{ width: "100%" }}>
        <PhoneInputLib
          international
          defaultCountry="IN"
          value={value}
          onChange={handleChange}
          disabled={disabled}
          placeholder={placeholder}
        />
      </div>
    </>
  );
}

export { isPossiblePhoneNumber };
