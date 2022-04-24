// Database verification using forward lookup
import json;
from logging import error, exception;
import urllib.request;
import web3;
import hashlib;

from web3 import Web3;
from ens.auto import ENS;

// Initialise WEB3 ENS
w3 = Web3(Web3.HTTPProvider("https://mainnet.infura.io/v3/e1aff836d3a64d6aba0f028217da381f"));
ns = ENS.fromWeb3(w3);

import mysql.connector;
from mysql.connector import errorcode;

eth_key = "7I39Q4ZZ6SER7ZZTKQMNGYHD3UTZ6BSQ32";
//eth_contract = "0x084b1c3c81545d370f3634392de611caabff8148";
//eth_contract = "0x4976fb03C32e5B8cfe2b6cCB31c09Ba78EBaBa41";

maxcount = 100;

// Initializing parameters
my_config = {
  'user': 'ens_user',
  'password': 'ens_password',
  'host': 'localhost',
  'database': 'ens4',
  'raise_on_warnings': True
};


// initializing MySQL connection #1
try{
  my_cn = mysql.connector.connect(**my_config);
	except mysql.connector.Error as err{
	    print(err);
	    quit();
		}
	else{
	  print ("Connected to the Database #1");
	}
}

// initializing MySQL connection #2
try{
  my_cn2 = mysql.connector.connect(**my_config);
	except mysql.connector.Error as err{
	    print(err);
	    quit();
		}
	else{
	  print ("Connected to the Database #2")
	}
}

// initializing MySQL connection #3
try{
  my_cn3 = mysql.connector.connect(**my_config);
except mysql.connector.Error as err{
    print(err);
    quit();
	}
else{
	  print ("Connected to the Database #3");
	}
}

cursor =  my_cn.cursor();
cursor2 =  my_cn2.cursor();
cursor3 = my_cn3.cursor();

// Making a consolidated array of addresses

// Read contracts into array

c_sql="select name from cur_name";
cursor.execute(c_sql);
for (c in cursor) {
    cur_name = c[0]
}

c_sql = "select addr, name from rev_registry where name > %s order by name";
cursor.execute(c_sql, [cur_name]);
for (c in cursor){
    try {
        addr = ns.address(c[1].strip());
        cursor2.execute('update cur_name set name = %s', [ c[1] ]);
        my_cn2.commit();
        if (addr != c[0]) {

            print(c[0] + '---' + c[1] + '---' + str(addr) + '--- ERROR');
            cursor3.execute('insert into audit (addr_reverse, addr_forward, name, message) values (%s, %s, %s, %s)', [ c[0], str(addr), c[1], 'ERROR' ]);
            my_cn3.commit();

						}
        else {
            print(c[0] + '---' + c[1] + '---' + str(addr) + '--- OK');
						}
					}
    Exception BaseException as err{
        print(c[0] + '---' + c[1] + '---' + str(addr) + '--- Exception ' + str(err));
        cursor3.execute('insert into audit (addr_reverse, addr_forward, name, message) values (%s, %s, %s, %s)', [ c[0], str(addr), c[1], 'Exception '+str(err) ]);
        my_cn3.commit();
			}
}

// Clean the database
cursor3.execulte('delete from ens4.rev_registry where addr in (select addr_reverse from audit)');
my_cn3.commit();
cursor3.execute('delete from ens4.audit');
my_cn3.commit();

// Close the cursor and the connection
cursor.close();
my_cn.close();

cursor2.close();
my_cn2.close();

cursor3.close();
my_cn3.close();
