'use strict';

const { text } = require('body-parser');
const { Board } = require('../model/msg-model');

const BoardModel = require('../model/msg-model').Board;
const ThreadModel = require('../model/msg-model').Thread;
const ReplyModel = require('../model/msg-model').Reply;

let date = new Date()
module.exports = function (app) {
  
  app
   .route('/api/threads/:board')
   .post(async (req,res) => {
      try {
      const {text, delete_password} = req.body
      let board = req.params.board || req.body.board
      
      let date = new Date();
      // Create and save new thread first   
      const newThread = new ThreadModel({
         board,
         text,
         delete_password,
         created_on: date,
         bumped_on: date
      });
      // save thread
      const savedThread = await newThread.save()
      //Look for board
      const foundBoard = await BoardModel.findOne({ name: board})

      if (!foundBoard) {
         // Create a new board if it doesn't exist
         const newBoard = new BoardModel({
           name: board,
           threads: [savedThread]
         });
         await newBoard.save();
       } else {
         // Push the new thread into the board's thread array
         foundBoard.threads.push(savedThread);
         await foundBoard.save();
       }
   
       // Redirect or send confirmation
       res.redirect(`/b/${board}`);
      } catch (error) {
         console.error('Error creating thread:', error);
         res.status(500).send('Server error');
      }
   })

   .get(async(req,res)=>{
      const board = req.params.board
      const foundBoard = await BoardModel.findOne({name: board})
      
      if(!foundBoard){
         console.log('board not found')
         return res.status(400).send('Board has not been found')
      }
      const sortedThreads = foundBoard.threads
         .sort((a,b) => b.bumped_on - a.bumped_on)
         .slice(0,10)
         .map((thread)=>{
            const sortedReplies = thread.replies
               .sort((a,b)=> b.created_on - a.created_on)
               .slice(0, 3)
               .reverse()
               .map(reply => ({
                  _id: reply._id,
                  text: reply.text,
                  created_on: reply.created_on
               }))       
            
            return{
                  _id: thread._id,
                  text: thread.text,
                  created_on: thread.created_on,
                  bumped_on: thread.bumped_on,
                  replies: sortedReplies,
                  replycount: thread.replies.length
               }
         
      })
         
      res.json(sortedThreads)
      
   })

   .put(async (req,res) => {
      const {thread_id} = req.body
      let board = req.params.board
      try{
         const Board = await BoardModel.findOne({name: board})
         if(!Board){
            res.send('board not found')
         } else {
            let reportedThread = Board.threads.id(thread_id);
            reportedThread.reported = true;
            reportedThread.bumped_on = date;
            await Board.save()
            res.send('reported')
         } 
      } catch (error){
         console.log(error.message)
      }
   })

   .delete(async (req,res)=>{
      const {thread_id, delete_password } = req.body
      let board = req.params.board
      const foundBoard = await BoardModel.findOne({name:board})
      if(!foundBoard){
         res.send('board not found')
      } else {   
      let threadForDel = foundBoard.threads.id(thread_id)
      if(threadForDel.delete_password === delete_password){
            foundBoard.threads.pull(threadForDel)
            await foundBoard.save()
            res.send('success')
         } else {
            res.send('incorrect password')
         }
      }
   }
   )

  app
   .route('/api/replies/:board')
   .post(async(req,res)=>{
      try{
         const {thread_id, text, delete_password} = req.body
         const board = req.params.board
         let date = new Date();

         const NewReplay = new ReplyModel({
            text,
            delete_password,
            created_on: date,
            bumped_on: date
         });

         const Reply = await BoardModel.findOne({ name: board })

         if(!Reply){
            return res.json('Board not found')
         }
               // thread board id 68010e79f5128966321fbdc8
         
         let threadToAddReply = Reply.threads.id(thread_id)
         
         if(!threadToAddReply){
            return res.json('Thread not found')
         }

         threadToAddReply.bumped_on = date;
         threadToAddReply.replies.push(NewReplay)
         await Reply.save()

         res.redirect('/b/' + board)
            
      } catch (error){
         console.error('Error posting reply:', error);
         res.status(500).send('Server error');
      }         
   })
   .get(async(req,res)=>{   
      const { thread_id } = req.query
      const board = req.params.board
      const Board = await BoardModel.findOne({ name: board })
      if(!Board){
         return res.json('Board not found')
      }

      const thread = Board.threads.id(thread_id)
      if(!thread){
         return res.json('Thread not found')
      }
      
      const sanitizedThread ={
         _id: thread.id,
         text: thread.text,
         created_on: thread.created_on,
         bumped_on: thread.bumped_on,
         replies: thread.replies.map((reply =>({
            _id:reply._id,
            text: reply.text,
            created_on: reply.created_on
         })))
      } 


      res.json(sanitizedThread)
   })
   .put(async(req,res)=>{
      const {thread_id, reply_id} = req.body
      const board = req.params.board
      try{
         const Board = await BoardModel.findOne({name: board})
         if(!Board){
            res.send( 'Board not found')
         }else{
            let date = new Date()
            let thread = Board.threads.id(thread_id)
            let reply = thread.replies.id(reply_id)
            reply.reported = true;
            reply.bumped_on = date;
            await Board.save()

            res.send('reported')
         }
      } catch(error){
         console.log(error.message)
      }
   })
   .delete(async(req,res)=>{
      const board = req.params.board
      const {thread_id, reply_id, delete_password} = req.body
      try {
         const Board = await BoardModel.findOne({name: board})
         let thread = Board.threads.id(thread_id)
         let reply = thread.replies.id(reply_id)
         if (reply.delete_password === delete_password){
            reply.text = '[deleted]'
            await Board.save()
            res.send('success')
         }else{
            res.send('incorrect password')
         }
      } catch (error) {
         console.log(error.message)
      }

   })
};
