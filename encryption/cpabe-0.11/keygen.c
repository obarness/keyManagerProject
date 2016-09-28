#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <strings.h>
#include <glib.h>
#include <pbc.h>
#include <pbc_random.h>

#include "bswabe.h"
#include "common.h"
#include "policy_lang.h"

char* usage =
"Usage: cpabe-keygen -o [OUTPUT FILE] -p [PUBLIC KEY] -m [MASTER KEY] -a [ATTRIBUTE]\n"
"\n"
"Generate a key with the listed attributes using public key PUB_KEY and\n"
"master secret key MASTER_KEY. Output will be written to the file\n"
"\"priv_key\" unless the -o option is specified.\n"
"\n"
"The client attribute is a number usually the client's id.\n"
"The attribute needs to be entered with the -a option.\n"
"The private key name will have the added postfix ""_[ID]"".\n"
"\n"
"Mandatory arguments to long options are mandatory for short options too.\n\n"
" -h, --help               	print this message\n\n"
" -v, --version            	print version information\n\n"
" -p,   			read public key from FILE\n\n"
" -m, 	 		  	read master secret key from FILE\n\n"
" -o, 				write resulting key to FILE\n\n"
" -a				the client's attribute\n\n"
"";

char*	pub_file = 0;	//public key file name
char*  	msk_file = 0;	//msk file name
char*  	out_file = 0;	//private key file name
long 	id_value = 0;

void
parse_args( int argc, char** argv )
{
	int i;

	for( i = 1; i < argc; i++ )
	{
		if(      !strcmp(argv[i], "-h") || !strcmp(argv[i], "--help") )
		{
			printf("%s", usage);
			exit(0);
		}
		else if( !strcmp(argv[i], "-v") || !strcmp(argv[i], "--version") )
		{
			printf(CPABE_VERSION, "-keygen");
			exit(0);
		}
		else if( !strcmp(argv[i], "-d") || !strcmp(argv[i], "--deterministic") )
		{
			pbc_random_set_deterministic(0);
		}
		else if( !strcmp(argv[i], "-p"))		//the flag for the public key file name
		{
			if( ++i >= argc )
			{
				die(usage);
			}
			else
			{
				pub_file = argv[i];
				printf("argument pub_file: %s\n", pub_file);
			}
		}
		else if( !strcmp(argv[i], "-m"))		//the flag for the master secret key file name
		{
			if( ++i >= argc )
			{
				die(usage);
			}
			else
			{
				msk_file = argv[i];
				printf("argument msk_file: %s\n", msk_file);
			}
		}
		else if (!strcmp(argv[i], "-o"))		//the flag for the private key file name
		{
			if( ++i >= argc )
			{
				die(usage);
			}
			else
			{
				out_file = argv[i];
				printf("argument out_file: %s\n", out_file);
			}
		}
		else if (!strcmp(argv[i], "-a"))		//the flag for the attribute
		{
			if( ++i >= argc )
			{
				die(usage);
			}
			else
			{
				id_value = atoi(argv[i]);		//convert the id from string to long;
				printf("argument attribute: %ld\n", id_value);
			}
		}
	}
	if( !msk_file || !pub_file || !out_file || (id_value == 0))
	{
		printf("cpabe-keygen - One of the files weren't initiated\n");
		die(usage);
	}
	out_file = g_strdup_printf("%s_%ld", out_file,id_value);
	printf("the private key file name is: %s\n", out_file);
}

//	FUNC NAME     CHANGE PRIVATE KEY    CHANGE PUB KEYS  ID ATTRIBUTE
//	cpabe-keygen -o keys/prv_id -p keys/pub -m keys/msk -a id
int
main( int argc, char** argv )
{
	bswabe_pub_t* pub;
	bswabe_msk_t* msk;
	bswabe_prv_t* prv;

	printf ("cpabe-keygen - Parsing arguments\n");
	parse_args(argc, argv);

	printf ("cpabe-keygen - Constructing the public keys");
	pub = bswabe_pub_unserialize(suck_file(pub_file), 1);
	msk = bswabe_msk_unserialize(pub, suck_file(msk_file), 1);

	printf ("cpabe-keygen - Entering keygen on libbwabe");
	prv = bswabe_keygen(msk, id_value);
	spit_file(out_file, bswabe_prv_serialize(prv), 1);

	return 0;
}
