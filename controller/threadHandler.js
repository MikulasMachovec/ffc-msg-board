const message_db = require(process.cwd() + '/model/msg-model.js');

exports.postThread = async (req, res, next) =>{
        try{
        const {board, text, delete_password} = req.body

        const newThread = new message_db({
            board:              board,
            text:               text,
            created_on:         new Date(),
            bumped_on:          new Date(),
            reported:           false,
            delete_password:    delete_password,
            replies:            []
        })
        await newThread.save()
        return res.redirect('/b/'+ board)
    }catch(error){
        throw new Error('Error in post Thread' + error.message);
        
    }
}

exports.getThread = async (req,res,next) => {
    try {
        const board = req.params.board
        const threadArr = await message_db.find({board: board})
            .sort({bumped_on: 'desc'})
            .limit(10)
            .lean()
            
            threadArr.forEach(e => {
                e.replycount = e.replies.length
                e.replies.sort((a,b)=>{
                    return b.created_on - a.created_on
                })   
                e.replies = e.replies.slice(0,3)                     
            });
        return res.json(threadArr)    
            
    } catch (error) {
        throw new Error('Error in get threat ' + error.message)
    }
    
}

exports.deleteThread = async (req,res,next) => {
    console.log('delete')
}

exports.putThread = async (req,res,next) => {
    console.log('put')
}