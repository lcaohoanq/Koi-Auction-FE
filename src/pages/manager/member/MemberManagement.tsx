import AddIcon from "@mui/icons-material/Add";
import { Alert, Button, CircularProgress, Container } from "@mui/material";
import axios from "axios";
import React, { useEffect, useState } from "react";
import PaginationComponent from "~/components/pagination/Pagination";
import { CrudButton } from "~/components/shared/CrudButtonComponent";
import { Member, MembersResponse } from "~/types/users.type";

const MemberManagement = () => {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(0);
  const itemsPerPage = 8; // A

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const response = await axios.get<MembersResponse>(
          "http://localhost:4000/api/v1/members",
          {
            params: {
              page: page - 1,
              limit: itemsPerPage,
            },
          },
        );

        const data = response.data;

        if (data && Array.isArray(data.item)) {
          setMembers(data.item);
          setTotalPages(data.total_page);
        } else {
          setError("Error fetching members");
        }
      } catch (err) {
        setError("Error fetching members");
      } finally {
        setLoading(false);
      }
    };

    fetchMembers();
  }, [page, itemsPerPage]);

  const handlePageChange = (
    event: React.ChangeEvent<unknown>,
    value: number,
  ) => {
    setPage(value);
  };

  const handleCreate = () => {
    alert("Create new member");
  };

  const handleView = (id: number) => {
    // Implement view logic
    //template string
    alert(`View member ${id}`);
  };

  const handleEdit = (id: number) => {
    // Implement edit logic
    alert(`Edit member ${id}`);
  };

  const handleDelete = (id: number) => {
    // Implement delete logic
    alert(`Delete member ${id}`);
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
        <h1 className="text-2xl font-bold">Member Management</h1>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleCreate}
        >
          Add New Member
        </Button>
      </div>

      <table className="whitespace-no-wrap w-full">
        <thead>
          <tr className="border-b bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
            <th className="px-4 py-3">Member</th>
            <th className="px-4 py-3">Email</th>
            <th className="px-4 py-3">Address</th>
            <th className="px-4 py-3">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y bg-white dark:divide-gray-700 dark:bg-gray-800">
          {members.map((member) => (
            <tr key={member.id} className="text-gray-700 dark:text-gray-400">
              <td className="px-4 py-3">
                <div className="flex items-center text-sm">
                  <div className="relative mr-3 hidden h-8 w-8 rounded-full md:block">
                    <img
                      className="h-full w-full rounded-full object-cover"
                      src={member.avatar_url}
                      alt=""
                      loading="lazy"
                    />
                    <div
                      className="absolute inset-0 rounded-full shadow-inner"
                      aria-hidden="true"
                    ></div>
                  </div>
                  <div>
                    <p className="font-semibold">{member.first_name}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Member
                    </p>
                  </div>
                </div>
              </td>
              <td className="px-4 py-3 text-sm">{member.email}</td>
              <td className="px-4 py-3 text-sm">{member.address}</td>
              <td className="px-4 py-3 text-sm">
                <div className="flex items-center space-x-4 text-sm">
                  <CrudButton
                    onClick={() => handleView(member.id)}
                    ariaLabel="View Member"
                    svgPath="view.svg"
                  />

                  <CrudButton
                    onClick={() => handleEdit(member.id)}
                    ariaLabel="Edit Member"
                    svgPath="edit.svg"
                  />

                  <CrudButton
                    onClick={() => handleDelete(member.id)}
                    ariaLabel="Delete Member"
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

export default MemberManagement;
