import { Alert, Button, CircularProgress, Container } from "@mui/material";
import axios from "axios";
import React, { useEffect, useState } from "react";
import AddIcon from "@mui/icons-material/Add";
import PaginationComponent from "~/components/pagination/Pagination";
import { Breeder, BreedersResponse } from "~/types/users.type";
import TableHeaderComponent from "~/components/shared/TableHeaderComponent";
import { BREEDER_MANAGEMENT_HEADER } from "~/constants/tableHeader";
import { CrudButton } from "~/components/shared/CrudButtonComponent";

const BreederManagement = () => {
  const [breeders, setBreeders] = useState<Breeder[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(0);
  const itemsPerPage = 8; // Adjusted to match the API limit parameter

  useEffect(() => {
    const fetchBreeders = async () => {
      try {
        const response = await axios.get<BreedersResponse>(
          "http://localhost:4000/api/v1/breeders",
          {
            params: {
              page: page - 1,
              limit: itemsPerPage,
            },
          },
        );

        const data = response.data;

        if (data && Array.isArray(data.item)) {
          setBreeders(data.item);
          setTotalPages(data.total_page);
        } else {
          setError("Error fetching breeders");
        }
      } catch (err) {
        setError("Error fetching breeders");
      } finally {
        setLoading(false);
      }
    };

    fetchBreeders();
  }, [page, itemsPerPage]);

  const handlePageChange = (
    event: React.ChangeEvent<unknown>,
    value: number,
  ) => {
    setPage(value);
  };

  const handleCreate = (breeder: Breeder) => {
    alert("Create new breeder");
  };

  const handleView = (id: number) => {
    alert(`View breeder ${id}`);
  };

  const handleEdit = (id: number) => {
    alert(`Edit breeder ${id}`);
  };

  const handleDelete = (id: number) => {
    alert(`Delete breeder ${id}`);
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
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Breeder Management</h1>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleCreate}
        >
          Add New Breeder
        </Button>
      </div>

      <table className="whitespace-no-wrap w-full">
        <TableHeaderComponent headers={BREEDER_MANAGEMENT_HEADER} />
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
              <td className="px-4 py-3 text-sm">
                {breeder?.phone_number || "Not provided"}
              </td>
              <td className="px-4 py-3 text-sm">{breeder.address}</td>
              <td className="px-4 py-3 text-sm">{breeder.status_name}</td>
              <td className="px-4 py-3 text-sm">
                {breeder.is_active ? "Yes" : "No"}
              </td>
              <td className="px-4 py-3 text-sm">{breeder.is_subscription}</td>
              <td className="px-4 py-3 text-sm">{breeder.account_balance}</td>
              <td className="px-4 py-3 text-sm">
                <div className="flex items-center space-x-4 text-sm">
                  <CrudButton
                    onClick={() => handleView(breeder.id)}
                    ariaLabel="View breeder"
                    svgPath="view.svg"
                  />

                  <CrudButton
                    onClick={() => handleEdit(breeder.id)}
                    ariaLabel="Edit breeder"
                    svgPath="edit.svg"
                  />

                  <CrudButton
                    onClick={() => handleDelete(breeder.id)}
                    ariaLabel="Delete breeder"
                    svgPath="delete.svg"
                  />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="xs:flex-row xs:justify-between flex flex-col items-center border-t bg-white px-5 py-5">
        <PaginationComponent
          totalPages={totalPages}
          currentPage={page}
          onPageChange={handlePageChange}
        />
      </div>
    </div>
  );
};

export default BreederManagement;