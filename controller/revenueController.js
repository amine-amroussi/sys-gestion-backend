const { Trip, Purchase, PaymentEmployee, Charge, Waste, Product } = require('../models');
const { Op } = require('sequelize');
const moment = require('moment');

const getFinancialSummary = async (req, res) => {
  try {
    const { period, startDate, endDate } = req.query;
    let dateFilter = {};
    let paymentDateFilter = {};

    // Calculate date range based on period
    const today = moment().startOf('day');
    let startMoment, endMoment;

    switch (period) {
      case 'today':
        startMoment = today;
        endMoment = moment().endOf('day');
        break;
      case 'lastWeek':
        startMoment = moment().subtract(7, 'days').startOf('day');
        endMoment = today;
        break;
      case 'last15Days':
        startMoment = moment().subtract(15, 'days').startOf('day');
        endMoment = today;
        break;
      case 'lastMonth':
        startMoment = moment().subtract(1, 'month').startOf('day');
        endMoment = today;
        break;
      case 'custom':
        if (!startDate || !endDate) {
          return res.status(400).json({ msg: 'Start date and end date are required for custom period.' });
        }
        startMoment = moment(startDate).startOf('day');
        endMoment = moment(endDate).endOf('day');
        break;
      default:
        return res.status(400).json({ msg: 'Invalid period specified.' });
    }

    // Date filter for trips, purchases, and charges
    dateFilter = {
      date: {
        [Op.gte]: startMoment.toDate(),
        [Op.lte]: endMoment.toDate(),
      },
    };

    // Payment filter for month/year
    const startYear = startMoment.year();
    const endYear = endMoment.year();
    const startMonth = startMoment.month() + 1; // Sequelize uses 1-12
    const endMonth = endMoment.month() + 1;

    paymentDateFilter = {
      [Op.or]: [],
    };
    for (let year = startYear; year <= endYear; year++) {
      const monthStart = year === startYear ? startMonth : 1;
      const monthEnd = year === endYear ? endMonth : 12;
      for (let month = monthStart; month <= monthEnd; month++) {
        paymentDateFilter[Op.or].push({ year, month });
      }
    }

    // Fetch trips for revenue
    const trips = await Trip.findAll({
      where: dateFilter,
      attributes: ['id', 'date', 'receivedAmount', "waitedAmount"],
    });
    const totalRevenue = trips.reduce((sum, trip) => sum + (parseFloat(trip.waitedAmount) || 0), 0);
    const revenueByDate = trips.reduce((acc, trip) => {
      const date = moment(trip.date).format('YYYY-MM-DD');
      acc[date] = (acc[date] || 0) + (parseFloat(trip.waitedAmount) || 0);
      return acc;
    }, {});

    // Fetch purchases
    const purchases = await Purchase.findAll({
      where: dateFilter,
      attributes: ['id', 'date', 'total'],
    });
    const totalPurchases = purchases.reduce((sum, purchase) => sum + (parseFloat(purchase.total) || 0), 0);
    const purchasesByDate = purchases.reduce((acc, purchase) => {
      const date = moment(purchase.date).format('YYYY-MM-DD');
      acc[date] = (acc[date] || 0) + (parseFloat(purchase.total) || 0);
      return acc;
    }, {});

    // Fetch payments
    const payments = await PaymentEmployee.findAll({
      where: {...paymentDateFilter, status: 'Paid'},
      attributes: ['payment_id', 'month', 'year', 'net_pay'],
    });
    const totalPayments = payments.reduce((sum, payment) => sum + (parseFloat(payment.net_pay) || 0), 0);
    const paymentsByDate = payments.reduce((acc, payment) => {
      const date = moment(`${payment.year}-${payment.month}-01`).format('YYYY-MM-DD');
      acc[date] = (acc[date] || 0) + (parseFloat(payment.net_pay) || 0);
      return acc;
    }, {});

    // Fetch charges
    const charges = await Charge.findAll({
      where: dateFilter,
      attributes: ['id', 'date', 'amount'],
    });
    const totalCharges = charges.reduce((sum, charge) => sum + (parseFloat(charge.amount) || 0), 0);
    const chargesByDate = charges.reduce((acc, charge) => {
      const date = moment(charge.date).format('YYYY-MM-DD');
      acc[date] = (acc[date] || 0) + (parseFloat(charge.amount) || 0);
      return acc;
    }, {});

    // fetch Wastes
    const wastes = await Waste.findAll({
      where: {createdAt: dateFilter.date},
      attributes: ['product',  'qtt'],
      include: [
        {
          model: Product,
          as: "ProductAssociation",
          attributes: ["designation", "priceUnite"],
        },
      ],
    })

    

    const totalWastes = wastes.reduce((sum, waste) => sum + (parseFloat(waste.qtt) * parseFloat(waste.ProductAssociation.priceUnite) || 0), 0);

    const wastesByDate = wastes.reduce((acc, waste) => {
      const date = moment(waste.createdAt).format('YYYY-MM-DD');
      acc[date] = (acc[date] || 0) + (parseFloat(waste.qtt) || 0);
      return acc;
    }, {});

    // const totalWastes = wastes.reduce((sum, waste) => sum + (parseFloat(waste.amount) || 0), 0);
    // const wastesByDate = wastes.reduce((acc, waste) => {
    //   const date = moment(waste.date).format('YYYY-MM-DD');
    //   acc[date] = (acc[date] || 0) + (parseFloat(waste.amount) || 0);
    //   return acc;
    // }, {});

    console.log(totalWastes)

    // Calculate net revenue
    // const netRevenue = totalRevenue - totalCharges - totalPurchases ;
    const netRevenue = totalRevenue - totalCharges - totalWastes - totalPurchases

    res.status(200).json({
      data: {
        totalRevenue: netRevenue.toFixed(2),
        revenueByDate,
        totalPurchases: totalPurchases.toFixed(2),
        purchasesByDate,
        totalPayments: totalPayments.toFixed(2),
        paymentsByDate,
        totalCharges: totalCharges.toFixed(2),
        chargesByDate,
        period,
        startDate: startMoment.toDate(),
        endDate: endMoment.toDate(),
      },
    });
  } catch (error) {
    console.error('Error fetching financial summary:', error);
    res.status(500).json({ msg: 'Server error while fetching financial summary.' });
  }
};

module.exports = { getFinancialSummary };