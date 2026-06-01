import { useState } from "react";

function ExpandableCard({ item }) {
  const [show, setShow] = useState(false);

  return (
    <div className="border rounded-lg p-4 bg-white shadow">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-semibold">
            {item.name}
          </h3>

          <p>{item.licenseNumber}</p>
        </div>

        <button
          onClick={() => setShow(!show)}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          {show ? "Hide" : "View"}
        </button>
      </div>

      {show && (
        <div className="mt-4">
          <img
            src={item.licenseImage}
            alt="License"
            className="w-96 rounded border"
          />
        </div>
      )}
    </div>
  );
}

export default ExpandableCard;