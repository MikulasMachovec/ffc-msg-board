const message_db = require(process.cwd() + '/model/msg-model.js');

exports.postReply = async (req, res, next) => {
    console.log(req.body)
    const{board, id, text} = req.body
}

exports.getReply = async (req, res, next) => {
    console.log('getReply')
}

exports.deleteReply = async (req, res, next) => {
    console.log('getReply')
}

exports.putReply = async (req, res, next) => {
    console.log('putReply')
}