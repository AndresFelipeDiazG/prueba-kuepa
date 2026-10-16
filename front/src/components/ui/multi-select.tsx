//bg-blue-50 bg-blue-100 text-blue-600
//bg-sky-50 bg-sky-100 text-sky-600
//bg-rose-50 bg-rose-100 text-rose-600
//bg-pink-50 bg-pink-100 text-pink-600


import React, { useState } from "react";
import { TbChevronDown, TbChevronUp } from "react-icons/tb";

type Option = {
  value: string;
  label: string;
};

type MultiselectProps = {
  options: Option[];
  value: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
  accent?: string;
};

export const MultiSelect: React.FC<MultiselectProps> = ({
  options,
  value = [],
  onChange,
  placeholder = "Select options...",
  accent = "blue",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const toggleOption = (_value: string) => {
    if (value?.includes(_value)) {
      onChange(value.filter((option) => option !== _value));
    } else {
      onChange([...value, _value]);
    }
  };

  const filteredOptions = options.filter((option) =>
    option.label?.toLowerCase()?.includes(searchTerm.toLowerCase())
  );

  return (
    <div className="relative w-full">
      <div
        className="border rounded-lg p-2 cursor-pointer flex justify-between items-center bg-white"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex gap-1 flex-wrap">
          {value?.length > 0 ? (
            value.map((value) => {
              const option = options.find((opt) => opt.value === value);
              return (
                <span
                  key={value}
                  className={`bg-${accent}-100 text-${accent}-600 px-2 py-1 rounded-full text-sm`}
                >
                  {option?.label}
                </span>
              );
            })
          ) : (
            <span className="text-gray-400">{placeholder}</span>
          )}
        </div>
        {
          isOpen ? 
            <span className="text-gray-500 px-2"><TbChevronUp /></span>
          :
            <span className="text-gray-500 px-2"><TbChevronDown /></span>
        }
      </div>

      {isOpen && (
        <div className="absolute z-10 mt-1 w-full bg-white border rounded-lg shadow-lg">
          <input
            type="text"
            placeholder="Buscar"
            className="w-full p-2 border-b"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <ul className="max-h-40 overflow-y-auto">
            {filteredOptions.map((option) => (
              <li
                key={option.value}
                onClick={() => toggleOption(option.value)}
                className={`p-2 hover:bg-${accent}-100 cursor-pointer flex items-center gap-2 ${
                  value?.includes(option.value)
                    ? `bg-${accent}-50`
                    : "bg-white"
                }`}
              >
                <input
                  type="checkbox"
                  checked={value?.includes(option.value)}
                  readOnly
                />
                {option.label}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
