const asyncHandler = require("../middleware/async");
const ErrorResponse = require("../utils/errorResponse");
var multer = require("multer");
var fs = require("fs");
const Room = require("../models/Room");
const Hostel = require("../models/Hostel");
const admin = require("firebase-admin");
const User = require("../models/User");
const SeatBooked  = require("../models/SeatBooked");
const Notification = require("../models/Notification");
// const serviceAccount = require("../feroshgah.json");
const sendMail = require("../utils/sendMail");
const braintree = require("braintree");
const { ObjectId } = require("mongoose");
var gateway = new braintree.BraintreeGateway({
  environment: braintree.Environment.Sandbox,
  merchantId: process.env.BRAINTREE_MERCHANT_ID,
  publicKey: process.env.BRAINTREE_PUBLIC_KEY,
  privateKey: process.env.BRAINTREE_PRIVATE_KEY
});


// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount),
// });

// @desc        Get all rooms
// @route       GET /api/v1/rooms
//@route        GET /api/v1/hostels/:hostelId/rooms
// @access      Public
exports.getrooms = asyncHandler(async (req, res, next) => {
  
  if (req.params.hostelId) {
    const rooms = await Room.find({ hostel: req.params.hostelId }).populate({
      path:"roommats",
      model:"User",
      select:"photo contactNumber name email"
    });
    // const rooms = await Room.aggregate([
    //   {
    //     $match:{hostel:req.params.hostelId}
    //   },
    //   {
    //     $lookup:{
    //       from:"users",
    //       localField:"roommats",
    //       foreignField:"_id",
    //       as:"rommats"

    //     }
    //   }
    // ])
    return res.status(200).json({
      success: true,
      count: rooms.length,
      data: rooms,
    });
  } else {
    res.status(200).json(res.advancedResults);
  }
});

// @desc        Get single room
// @route       GET /api/v1/rooms/:id
// @access      Public
exports.getroom = asyncHandler(async (req, res, next) => {
  const room = await Room.findById(req.params.id).populate({
    path: "hostel",
    select: "name description",
  });

  if (!room) {
    return next(
      new ErrorResponse(`No course with the id of ${req.params.id}`, 404)
    );
  }

  res.status(200).json({
    success: true,
    data: room,
  });
});

// @desc       Add room
// @route      POST /api/v1/hostels/:hostelId/rooms
// @access     Private
exports.addRoom = asyncHandler(async (req, res, next) => {
  req.body.hostel = req.params.hostelId;
  req.body.user = req.user.id;

  const hostel = await Hostel.findById(req.params.hostelId);
  if (!hostel) {
    return next(
      new ErrorResponse(`No hostel with the id of ${req.params.hostelId}`, 404)
    );
  }

  // Make sure user is hostel owner
  if (hostel.user.toString() !== req.user.id && req.user.role !== "admin") {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to add a room to hostel ${hostel._id}`,
        400
      )
    );
  }
  let room = await Room.findOne({ hostel: req.params.hostelId, roomNumber:req.body.roomNumber });
  if(room) {
    return next(new ErrorResponse("This room# already exists, Please choose another number#", 400));
  }


   room = await Room.create(req.body);

  res.status(200).json({
    success: true,
    data: room,
  });
});

// @desc       Update room
// @route      PUT /api/v1/rooms/:id
// @access     Private
exports.updateRoom = asyncHandler(async (req, res, next) => {
  let room = await Room.findById(req.params.id);
  if (!room) {
    return next(
      new ErrorResponse(`No room with the id of ${req.params.id}`, 404)
    );
  }
  const rm  =  await Room.findOne({hostel:room.hostel,roomNumber:req.body.roomNumber});
  if(rm) {
    return next(
      new ErrorResponse(`Room already exists with this number. try another number`, 404)
    );
  }


  // Make sure user is room owner
  if (room.user.toString() !== req.user.id && req.user.role !== "admin") {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to update room`,
        400
      )
    );
  }
  
  if(room.seater < req.body.seater) {
    
    req.body.remaining_seats = room.remaining_seats+(req.body.seater - room.seater);
  }else if (room.seater >req.body.seater && room.roommats.length>req.body.seater) {
    return next(new ErrorResponse("before updating the no. of seats, first remove previous roommats"));
  }else if(room.seater >req.body.seater && room.roommats.length<req.body.seater){
  
req.body.remaining_seats = req.body.seater- room.roommats.length;
  }

  room = await Room.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    data: room,
  });
});

// @desc       Delete room
// @route      DELETE /api/v1/rooms/:id
// @access     Private
exports.deleteRoom = asyncHandler(async (req, res, next) => {
  let room = await Room.findById(req.params.id);

  if (!room) {
    return next(
      new ErrorResponse(`No room with the id of ${req.params.id}`, 404)
    );
  }

  // Make sure user is room owner
  if (room.user.toString() !== req.user.id && req.user.role !== "admin") {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to delete room`,
        400
      )
    );
  }

  await Room.deleteOne();

  res.status(200).json({
    success: true,
    data: {},
  });
});

//@desc   Book room
//@route  POST /api/v1/rooms/:id/book
//@access Public
exports.BookRoom = async (req, res, next) => {
  // const {title, body} = req.body;
  let room = await Room.findOne({_id:req.params.id});
 
  if (!room) {
    return next(new ErrorResponse(`Room not found with this ${req.params.id}`));
  }
  const hostelId = room.hostel;

 
  const hostel = await Hostel.findById(hostelId);
  if (!hostel) {
    return next( new ErrorResponse("No hostel Found for this room"));
  }
  const owner =  await User.findById(hostel.user);
    const token  = owner.fcmToken;
    const userToken = req.user.fcmToken;
    if(!token) {
      return next(new ErrorResponse("please provide fcm token of the owner"));
    }
    if(!userToken) {
      return next(new ErrorResponse("please fcm token of the user"));
    }
  // const isAlreadyBooked = await Room.find({hostel:hostelId, roommats:req.user.id});
  const isAlreadyBooked = await Room.aggregate([
    {
     $match: { hostel: hostelId}
    },
    
   {
    $project: {
      "hostel" : "$hostel",
      "hasRoommats" : {
        $in: [req.user.id, "$roommats" ]
      }
    }
  }
  
  ]);
  if(isAlreadyBooked[0].hasRoommats) {
    return next(new ErrorResponse("You already booked room in this hostel", 400));
  }
  // if (room.roommats.includes(req.user.id)) {
  //   return res
  //     .status(400)
  //     .json({ success: false, message: "you Already booked this room" });
  // }

  // room.roommats.length < room.seater
  if (room?.roommats?.length < room?.seater) {
    const nonceFromTheClient = req.body.paymentMethodNonce;
  const amount = req.body.amount;
  const newTransaction = await gateway.transaction.sale({
    amount:amount,
    paymentMethodNonce:nonceFromTheClient,
    options:{
      submitForSettlement:true
    }
  });

  if(!newTransaction){
   return next( new ErrorResponse("Token not returned by braintree, try again", 400));
  }
  req.body.user = req.user.id;
  const data = {
    amount: newTransaction.transaction.amount,
    transaction_id: newTransaction.transaction.id,
    hostel: req.body.hostel,
    roomNumber: req.body.roomNumber,
    bookedBy: req.body.user,
    no_of:"hostel"
  };
  await SeatBooked.create(data);
  // room.availableSeats= room.availableSeats-1;
  room.remaining_seats= room?.remaining_seats-1;
   
    room?.roommats.push(req.user.id);
    await room?.save();

    
    const OwnerMessage = `Your customer ${req.user.name} has booked seat in room ${room?.roomNumber} of hostel ${hostel.name}`;
    const Usermessage= `you booked hostel seat in hostel ${hostel.name} from the owner ${owner.email}`;
    await Notification.create({
      user: req.user.id,
      publisher: hostel.user,
      amount: newTransaction.transaction.amount,
      transaction_id: newTransaction.transaction.id,
      roomNumber: req.body.roomNumber,
      OwnerMessage: OwnerMessage,
      Usermessage: Usermessage,
    });
    var payload = {
      notification: {
        title: "Room Booking",
        body: `Room booked by , ${req.user.name}`,
      },
    };
    var payload1 = {
      notification: {
        title: "Room Booking",
        body: `you booked room  ${room?.roomNumber} of hostel ${hostel.name} successfully`,
      },
    };
    
      await admin.messaging().sendToDevice(token, payload);
      await admin.messaging().sendToDevice(userToken, payload1);
    // await sendMail({
    //   mail:req.user.email,
    //   subject: "Seat Booked sucessfully",
    //   message:message1
    // });

    return res.status(201).json({
      success: true,
      message: "Room booked successfully",
    });
  } else {
    return next(new ErrorResponse(" This Room already full, try another ", 400));

    // return {
    //   success: false,
    //   message: "Room already full, try another",
    // };
  }
};
exports.RemoveUser = asyncHandler(async(req, res, next) => {
  const {userId} = req.body;
  const roomId= req.params.id;
  let room = await Room.findById(roomId);
if(!room) {
  return next(new ErrorResponse("Room not found with given id", 400));
}
const {roommats} = room;
const index = roommats.indexOf(userId);
if (index > -1) {
  roommats.splice(index, 1);
  room.roommats =roommats
  room.remaining_seats = room.remaining_seats +1 ;
  await room.save();
}else {
  return next(new ErrorResponse("Opps! Something went wrong"));
}

return res.status(200).json({
  success:true,
  message:"User removed successfully from room"
})

})
