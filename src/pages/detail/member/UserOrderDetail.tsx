import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Card,
  CardContent,
  CardMedia,
  Container,
  Grid,
  Paper,
  Typography,
  useTheme,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import PaymentIcon from "@mui/icons-material/Payment";
import LoadingComponent from "~/components/shared/LoadingComponent";
import {
  fetchOrderDetails,
  updateOrder,
  createOrderPayment,
  getOrderById,
  confirmOrder,
} from "~/utils/apiUtils";
import { Order, OrderDetail, OrderStatus } from "~/types/orders.type";
import { toast, ToastContainer } from "react-toastify";
import { getCookie } from "~/utils/cookieUtils";
import TextField from "@mui/material/TextField";
import SaveIcon from "@mui/icons-material/Save";
import CancelIcon from "@mui/icons-material/Cancel";
import { PaymentDTO } from "./UserOrder";
import { useUserData } from "~/hooks/useUserData";
import { useMediaQuery } from "@mui/material";
import Feedback from "./Feedback";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import InputLabel from "@mui/material/InputLabel";
import FormControl from "@mui/material/FormControl";
import { getUserCookieToken } from "~/utils/auth.utils";

export type OrderDetailWithKoi = OrderDetail & {
  koi: {
    name: string;
    image_url: string;
    owner_id: number;
  };
};

const UserOrderDetail: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const theme = useTheme();
  const [orderDetails, setOrderDetails] = useState<OrderDetailWithKoi[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedOrder, setEditedOrder] = useState<Order | null>(null);
  const { user, loading: userLoading, error: userError } = useUserData();
  const [order, setOrder] = useState<Order | null>(null);
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogAction, setDialogAction] = useState<string>("");
  const [dialogMessage, setDialogMessage] = useState<string>("");

  const token = getUserCookieToken();

  useEffect(() => {
    if (!token) {
      return;
    }

    if (orderId) {
      setLoading(true);
      getOrderById(parseInt(orderId), getCookie("access_token") || "")
        .then((order) => {
          setOrder(order);
        })
        .catch((err) => {
          console.error("Error fetching order:", err);
          setError("Failed to fetch order");
        });

      fetchOrderDetails(parseInt(orderId), token)
        .then((details) => {
          if (Array.isArray(details)) {
            setOrderDetails(details);
          } else {
            console.error("Received non-array orderDetails:", details);
            setError("Invalid order details format");
          }
        })
        .catch((err) => {
          console.error("Error fetching order details:", err);
          setError("Failed to fetch order details");
        })
        .finally(() => setLoading(false));
    }
  }, [orderId]);

  const totalOrderAmount = orderDetails.reduce(
    (sum, detail) => sum + detail.total_money,
    0,
  );

  const handleEditOrder = () => {
    setIsEditing(true);
    setEditedOrder(order);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedOrder(null);
  };

  const handleSaveEditedOrder = async () => {
    if (!token) {
      return;
    }

    if (editedOrder) {
      try {
        const updatedOrder = await updateOrder(
          editedOrder,
          getCookie("access_token") || "",
        );

        if (updatedOrder && updatedOrder.id) {
          setOrder(updatedOrder);
          const refreshedDetails = await fetchOrderDetails(
            updatedOrder.id,
            token,
          );
          setOrderDetails(refreshedDetails);
        }
        toast.success("Order updated successfully");
        setIsEditing(false);
      } catch (error) {
        console.error("Error updating order:", error);
        toast.error("Failed to update order. Please try again.");
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditedOrder((prev) => (prev ? { ...prev, [name]: value } : null));
  };

  const handlePayment = async () => {
    if (order) {
      try {
        const paymentDTO: PaymentDTO = {
          payment_amount: order.total_money,
          payment_method: order.payment_method,
          payment_type: "ORDER",
          order_id: order.id,
          user_id: user?.id || 0,
        };

        const paymentResponse = await createOrderPayment(
          paymentDTO,
          getCookie("access_token") || "",
        );

        if (paymentResponse) {
          if (order.payment_method === "Cash") {
            toast.success("Cash payment recorded successfully");
          } else {
            if (paymentResponse.paymentUrl) {
              window.location.href = paymentResponse.paymentUrl;
            } else {
              throw new Error("No payment URL received for online payment");
            }
          }
        } else {
          throw new Error("Failed to create payment");
        }
      } catch (error) {
        console.error("Error processing payment:", error);
        if (error instanceof Error) {
          toast.error(error.message);
        } else {
          toast.error("Failed to process payment. Please try again.");
        }
      }
    }
  };

  // Add this function to format the date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const koiItems = orderDetails.map((detail) => ({
    id: detail.koi.owner_id,
    name: detail.koi.name,
    thumbnail: detail.koi.image_url,
  }));

  const handleUpdateOrderStatus = async (newStatus: OrderStatus) => {
    if (order && order.id) {
      try {
        const updatedOrder = await confirmOrder(
          order.id,
          newStatus,
          getUserCookieToken() || "",
        );
        setOrder(updatedOrder);
        toast.success(`Order status updated to ${newStatus} successfully`);
      } catch (error) {
        console.error("Error updating order status:", error);
        toast.error("Failed to update order status. Please try again.");
      }
    }
  };

  const handleOpenDialog = (action: string, message: string) => {
    setDialogAction(action);
    setDialogMessage(message);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleConfirmAction = async () => {
    setOpenDialog(false);
    switch (dialogAction) {
      case "payment":
        await handlePayment();
        break;
      case "delivery":
        await handleUpdateOrderStatus(OrderStatus.DELIVERED);
        break;
      case "cancel":
        await handleUpdateOrderStatus(OrderStatus.CANCELLED);
        break;
    }
  };

  return (
    <Container maxWidth="lg">
      <Paper elevation={3} sx={{ p: 4, my: 4 }}>
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={4}
        >
          <Typography variant="h4">Order Details</Typography>
          <Button
            variant="outlined"
            color="primary"
            onClick={() => navigate("/orders")}
          >
            Back to Orders
          </Button>
        </Box>

        {loading && (
          <Box display="flex" justifyContent="center" my={4}>
            <LoadingComponent />
          </Box>
        )}

        {error && (
          <Typography color="error" mb={4}>
            {error}
          </Typography>
        )}

        {order && orderDetails.length > 0 && (
          <>
            <Typography variant="h5" gutterBottom>
              Order #{orderId}
            </Typography>

            <Grid container spacing={4}>
              {/* Koi Image and Details */}
              <Grid item xs={12} md={4}>
                <Card elevation={3}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {orderDetails[0].koi.name}
                    </Typography>
                    <Box
                      sx={{
                        backgroundColor: "rgb(79 146 209)",
                        p: 1,
                        borderRadius: 1,
                        mb: 2,
                      }}
                    >
                      <CardMedia
                        component="img"
                        height="200"
                        image={orderDetails[0].koi.image_url}
                        alt={orderDetails[0].koi.name}
                        sx={{ objectFit: "contain", borderRadius: 1 }}
                      />
                    </Box>
                    <Typography variant="body1" gutterBottom>
                      <strong>Order Date:</strong>{" "}
                      {formatDate(order.order_date)}
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      <strong>Total Amount:</strong> $
                      {totalOrderAmount.toFixed(2)}
                    </Typography>
                    <Typography variant="body1">
                      <strong>Est. Ship Date:</strong>{" "}
                      {formatDate(order.shipping_date)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              {/* Order Details */}
              <Grid item xs={12} md={8}>
                <Card elevation={3}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Order Information
                    </Typography>
                    <Grid container spacing={3}>
                      <Grid item xs={12} sm={6}>
                        <FormControl fullWidth margin="normal">
                          <InputLabel id="payment-method-label">
                            Payment Method
                          </InputLabel>
                          <Select
                            labelId="payment-method-label"
                            id="payment-method"
                            name="payment_method"
                            value={
                              editedOrder?.payment_method ||
                              order.payment_method
                            }
                            label="Payment Method"
                            onChange={(e) =>
                              handleInputChange(
                                e as React.ChangeEvent<HTMLInputElement>,
                              )
                            }
                            disabled={!isEditing}
                          >
                            <MenuItem value="Cash">Cash</MenuItem>
                            <MenuItem value="Payment">Payment</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          margin="normal"
                          name="phone_number"
                          label="Phone Number"
                          value={
                            editedOrder?.phone_number || order.phone_number
                          }
                          onChange={handleInputChange}
                          disabled={!isEditing}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          margin="normal"
                          name="shipping_address"
                          label="Shipping Address"
                          value={
                            editedOrder?.shipping_address ||
                            order.shipping_address
                          }
                          onChange={handleInputChange}
                          disabled={!isEditing}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          margin="normal"
                          name="note"
                          label="Note"
                          multiline
                          rows={3}
                          value={editedOrder?.note || order.note}
                          onChange={handleInputChange}
                          disabled={!isEditing}
                        />
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>

                {/* Action Buttons */}
                <Box mt={4} display="flex" justifyContent="space-between">
                  {isEditing ? (
                    <>
                      <Button
                        variant="contained"
                        color="primary"
                        startIcon={<SaveIcon />}
                        onClick={handleSaveEditedOrder}
                      >
                        Save Changes
                      </Button>
                      <Button
                        variant="outlined"
                        color="secondary"
                        startIcon={<CancelIcon />}
                        onClick={handleCancelEdit}
                      >
                        Cancel
                      </Button>
                    </>
                  ) : (
                    order.status === OrderStatus.PENDING && (
                      <Button
                        variant="contained"
                        color="primary"
                        startIcon={<EditIcon />}
                        onClick={handleEditOrder}
                      >
                        Edit Order
                      </Button>
                    )
                  )}
                  {order.status === OrderStatus.PENDING && (
                    <Button
                      variant="contained"
                      color="secondary"
                      startIcon={<PaymentIcon />}
                      onClick={() =>
                        handleOpenDialog(
                          "payment",
                          "Are you sure you want to process the payment for this order?",
                        )
                      }
                    >
                      Process Payment
                    </Button>
                  )}
                  {order && order.status === OrderStatus.SHIPPED && (
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={() =>
                        handleOpenDialog(
                          "delivery",
                          "Are you sure you want to confirm the delivery of this order?",
                        )
                      }
                    >
                      Confirm Delivery
                    </Button>
                  )}
                  {order &&
                    (order.status === OrderStatus.PENDING ||
                      order.status === OrderStatus.PROCESSING) && (
                      <Button
                        variant="contained"
                        color="secondary"
                        onClick={() =>
                          handleOpenDialog(
                            "cancel",
                            "Are you sure you want to cancel this order?",
                          )
                        }
                      >
                        Cancel Order
                      </Button>
                    )}
                </Box>
                {/* Feedback Section */}
                {order && order.status !== "PENDING" && (
                  <Paper elevation={3} sx={{ p: 3, mt: 4 }}>
                    <Feedback orderId={orderId || ""} />
                  </Paper>
                )}
              </Grid>
            </Grid>
          </>
        )}
      </Paper>

      {/* Confirmation Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">{"Confirm Action"}</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            {dialogMessage}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleConfirmAction} autoFocus>
            Confirm
          </Button>
        </DialogActions>
      </Dialog>

      <ToastContainer />
    </Container>
  );
};

export default UserOrderDetail;
