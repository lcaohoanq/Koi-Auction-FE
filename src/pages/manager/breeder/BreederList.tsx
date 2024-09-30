import React from "react";
import { useEffect, useState } from "react";
import axios from "axios";
import { Container, CircularProgress, Alert } from "@mui/material";

interface Breeder {
  id: number;
  first_name: string;
  last_name: string;
  phone_number: string | null;
  email: string;
  address: string;
  password: string | null;
  status_name: string;
  date_of_birth: number;
  avatar_url: string;
  google_account_id: number;
  role_name: string;
  account_balance: number;
}

interface BreedersResponse {
  total_page: number;
  total_item: number;
  item: Breeder[];
}

const BreederList = () => {
  const [breeders, setBreeders] = useState<Breeder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBreeders = async () => {
      try {
        const response = await axios.get<BreedersResponse>(
          "http://localhost:4000/api/v1/breeders",
          {
            params: {
              page: 0,
              limit: 5,
            },
          },
        );
        setBreeders(response.data.item);
        setLoading(false);
      } catch (err) {
        setError("Error fetching breeders");
        setLoading(false);
      }
    };

    fetchBreeders();
  }, []);

  if (!Array.isArray(breeders)) {
    return <div>Error: Breeders data is not an array</div>;
  }

  const handleView = (id) => {
    // Implement view logic
    console.log("View breeder", id);
  };

  const handleEdit = (id) => {
    // Implement edit logic
    console.log("Edit breeder", id);
  };

  const handleDelete = (id) => {
    // Implement delete logic
    console.log("Delete breeder", id);
  };

  if (loading) {
    return (
      <Container>
        <CircularProgress />
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <div className="w-full overflow-x-auto">
      <table className="whitespace-no-wrap w-full">
        <thead>
          <tr className="border-b bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
            <th className="px-4 py-3">Breeder</th>
            <th className="px-4 py-3">Email</th>
            <th className="px-4 py-3">Address</th>
            <th className="px-4 py-3">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y bg-white dark:divide-gray-700 dark:bg-gray-800">
          {breeders.map((breeder) => (
            <tr key={breeder.id} className="text-gray-700 dark:text-gray-400">
              <td className="px-4 py-3">
                <div className="flex items-center text-sm">
                  <div className="relative mr-3 hidden h-[3rem] w-[3rem] rounded-full md:block">
                    <img
                      className="w-full rounded-full object-cover"
                      src={breeder.avatar_url}
                      alt=""
                      loading="lazy"
                    />
                    <div
                      className="absolute inset-0 rounded-full shadow-inner"
                      aria-hidden="true"
                    ></div>
                  </div>
                  <div>
                    <p className="font-semibold">{breeder.first_name}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Breeder
                    </p>
                  </div>
                </div>
              </td>
              <td className="px-4 py-3 text-sm">{breeder.email}</td>
              <td className="px-4 py-3 text-sm">{breeder.address}</td>
              <td className="px-4 py-3 text-sm">
                <div className="flex items-center space-x-4 text-sm">
                  <button
                    onClick={() => handleView(breeder.id)}
                    className="focus:shadow-outline-gray flex items-center justify-between rounded-lg px-2 py-2 text-sm font-medium leading-5 text-purple-100 focus:outline-none dark:text-gray-400"
                    aria-label="View"
                  >
                    <svg
                      className="h-5 w-5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                      <path
                        fillRule="evenodd"
                        d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleEdit(breeder.id)}
                    className="focus:shadow-outline-gray flex items-center justify-between rounded-lg px-2 py-2 text-sm font-medium leading-5 text-purple-100 focus:outline-none dark:text-gray-400"
                    aria-label="Edit"
                  >
                    <svg
                      className="h-5 w-5"
                      aria-hidden="true"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"></path>
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDelete(breeder.id)}
                    className="focus:shadow-outline-gray flex items-center justify-between rounded-lg px-2 py-2 text-sm font-medium leading-5 text-purple-100 focus:outline-none dark:text-gray-400"
                    aria-label="Delete"
                  >
                    <svg
                      className="h-5 w-5"
                      aria-hidden="true"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      ></path>
                    </svg>
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default BreederList;