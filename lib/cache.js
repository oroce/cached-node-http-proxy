/*jshint expr:true*/
var
	crypto = require( "crypto" ),
	redis = require( "redis" ),
	keyGen = function( req ){
		return req.url + req.query;
	};

var RedisCache = function _RedisCacheCtor( options ){
	var self = this;
	this.client = options.client || new redis.createClient(options.port || options.socket, options.host, options.redisOpts);
	if (options.pass) {
		this.client.auth(options.pass, function(err){
			if (err) throw err;
		});
	}
	this.prefix = options.prefix || "";
	this.ttl = options.ttl||30;
	if( options.db ){
		self.client.select(options.db);
		self.client.on("connect", function() {
			self.client.send_anyways = true;
			self.client.select(options.db);
			self.client.send_anyways = false;
		});
	}

	this.keyGen = options.keyGen || keyGen;
};

RedisCache.prototype.getUrlKey = function _RedisCacheGetUrlKey( req ){
	var hash = crypto.createHash( "sha1" );
	hash.update( this.keyGen( req ) );
	return hash.digest( "hex" );
};

RedisCache.prototype.get = function _RedisCacheGet( key, cb ){
	key = this.prefix + key;
	this.client.get( key, function( err, value ){
		if( err ){
			return cb( err );
		}
		if( !value ){
			return cb();
		}
		cb( null, new Buffer( value, "base64" ) );
	});
};

RedisCache.prototype.set = function _RedisCacheSet( key, value, cb ){
	key = this.prefix + key;
	this.client.setex( key, this.ttl, value.toString("base64"), cb );
};

RedisCache.prototype.handleReq = function _RedisCacheHandleReq( req, res, next ){
	var
		urlKey = this.getUrlKey( req ),
		self = this;
	this.get( urlKey, function( err, response ){
		if( err ){
			return next( err );
		}
		if( response ){
			return res.send( response );
		}
		self.bindRes( urlKey, req, res, next );
	});
};
RedisCache.prototype.bindRes = function _RedisCacheBindRes( urlKey, req, res, next ){
	var
		chunks = [],
		length = 0,
		write = res.write,
		end = res.end,
		self = this;

	res.write = function( chunk, encoding ){
		if( !this.headerSent ){
			this._implicitHeader();
		}

		write.call( res, chunk, encoding );

		if( !Buffer.isBuffer(chunk) ){
			chunk = new Buffer(chunk, encoding);
		}

		length += chunk.length;
		chunks.push( chunk );
	};

	res.end = function( chunk, encoding ){
		if( chunk ){
			this.write(chunk, encoding);
		}

		end.call( res );
		if( res.statusCode !== 200 ){
			return;
		}
		var buf = Buffer.concat(chunks, length );

		self.set( urlKey, buf, console.log.bind( console ) );
	};
	next();
};
module.exports = function( options ){
	options || ( options = {} );
	var redisCache = new RedisCache( options );
	return redisCache.handleReq.bind( redisCache );
};
exports.RedisCache = RedisCache;

exports.keyGen = keyGen;