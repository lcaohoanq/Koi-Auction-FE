import React, { useEffect, useState } from "react";
import {
  Alert,
  CircularProgress,
  Container,
  Dialog,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  Chip,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import { fetchUserOrders, fetchOrderDetails } from "../../utils/apiUtils";
import { useUserData } from "~/contexts/useUserData";
import PaginationComponent from "~/components/pagination/Pagination";
import UserOrderDetail from "./UserOrderDetail";
import { OrderDetail } from "./UserOrderDetail";

export type Order = {
  id: number;
  first_name: string;
  last_name: string;
  total_money: number;
  phone_number: string;
  address: string;
  order_date: string;
  shipping_method: string;
  shipping_address: string;
  shipping_date: string;
  status: string;
  tracking_number: string;
};

const UserOrder = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(theme.breakpoints.between("sm", "md"));
  const { user, loading: userLoading, error: userError } = useUserData();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(0);
  const itemsPerPage = 8;
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);

  useEffect(() => {
    const fetchOrders = async () => {
      if (user) {
        try {
          const response = await fetchUserOrders(user.id);
          setOrders(
            response.slice((page - 1) * itemsPerPage, page * itemsPerPage),
          );
          setTotalPages(Math.ceil(response.length / itemsPerPage));
        } catch (err) {
          setError("Error fetching orders");
        } finally {
          setLoading(false);
        }
      }
    };

    if (user) {
      fetchOrders();
    }
  }, [user, page]);

  const handlePageChange = (
    event: React.ChangeEvent<unknown>,
    value: number,
  ) => {
    setPage(value);
  };

  const handleOrderClick = (orderId: number) => {
    setSelectedOrderId(orderId);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedOrderId(null);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return "warning";
      case "shipped":
        return "info";
      case "delivered":
        return "success";
      case "cancelled":
        return "error";
      default:
        return "default";
    }
  };

  if (userLoading || loading) {
    return (
      <Container
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "80vh",
        }}
      >
        <CircularProgress />
      </Container>
    );
  }

  if (userError || error) {
    return (
      <Container>
        <Alert severity="error">{userError || error}</Alert>
      </Container>
    );
  }

  if (!user) return <Alert severity="info">No user data found</Alert>;
  if (orders.length === 0)
    return <Alert severity="info">No orders found</Alert>;

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          My Orders
        </Typography>
      </Box>

      <Grid container spacing={2}>
        {orders.map((order) => (
          <Grid item xs={12} sm={6} md={4} key={order.id}>
            <Card
              onClick={() => handleOrderClick(order.id)}
              sx={{
                cursor: "pointer",
                transition: "0.3s",
                "&:hover": { transform: "translateY(-5px)", boxShadow: 3 },
                height: "100%",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <CardContent
                sx={{ flexGrow: 1, display: "flex", flexDirection: "column" }}
              >
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 2,
                  }}
                >
                  <Typography
                    variant={isMobile ? "subtitle1" : "h6"}
                    component="div"
                  >
                    Order #{order.id}
                  </Typography>
                  <Chip
                    label={order.status}
                    color={getStatusColor(order.status)}
                    size="small"
                  />
                </Box>
                <Typography
                  color="text.secondary"
                  variant={isMobile ? "body2" : "body1"}
                  gutterBottom
                >
                  {new Date(order.order_date).toLocaleDateString()}
                </Typography>
                <Typography variant={isMobile ? "body2" : "body1"} gutterBottom>
                  {order.first_name} {order.last_name}
                </Typography>
                <Typography
                  variant={isMobile ? "body1" : "h6"}
                  fontWeight="bold"
                  gutterBottom
                >
                  Total: ${order.total_money.toFixed(2)}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Shipping: {order.shipping_method}
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                  }}
                >
                  Address: {order.shipping_address}
                </Typography>
                <Box sx={{ mt: "auto", pt: 2, textAlign: "right" }}>
                  <Button
                    size={isMobile ? "small" : "medium"}
                    color="primary"
                    variant="outlined"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOrderClick(order.id);
                    }}
                  >
                    View Details
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Box sx={{ mt: 4, display: "flex", justifyContent: "center" }}>
        <PaginationComponent
          totalPages={totalPages}
          currentPage={page}
          onPageChange={handlePageChange}
        />
      </Box>

      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        {selectedOrderId && (
          <UserOrderDetail
            orderId={selectedOrderId}
            onClose={handleCloseDialog}
          />
        )}
      </Dialog>
    </Container>
  );
};

export default UserOrder;