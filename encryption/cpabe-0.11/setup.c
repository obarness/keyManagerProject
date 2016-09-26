#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <glib.h>
#include <pbc.h>
#include <pbc_random.h>

#include "bswabe.h"
#include "common.h"

char* usage =
"Usage: cpabe-setup -p [PUBLIC KEY] -m [MASTER KEY]\n"
"\n"
"Generate system parameters, a public key, and a master secret key\n"
"for use with cpabe-keygen, cpabe-enc, and cpabe-dec.\n"
"\n"
"Output will be written to the files \"pub_key\" and \"master_key\"\n"
"unless the -p or -m options are used.\n"
"\n"
"Mandatory arguments to long options are mandatory for short options too.\n\n"
" -h, --help                    print this message\n\n"
" -v, --version                 print version information\n\n"
" -p 				write public key to FILE\n\n"
" -m 				write master secret key to FILE\n\n"
"";

char* pub_file = 0;		//the public key file name
char* msk_file = 0;		//the master secret key file name

void
parse_args( int argc, char** argv )
{
	int i;

	for( i = 1; i < argc; i++ )
	{
		if( !strcmp(argv[i], "-h") || !strcmp(argv[i], "--help") )
		{
			printf("%s", usage);
			exit(0);
		}
		else if( !strcmp(argv[i], "-v") || !strcmp(argv[i], "--version") )
		{
			printf(CPABE_VERSION, "-setup");
			exit(0);
		}
		else if( !strcmp(argv[i], "-p"))
		{
			if( ++i >= argc )
			{
				die(usage);
			}
			else
			{
				pub_file = argv[i];
			}
		}
		else if( !strcmp(argv[i], "-m"))
		{
			if( ++i >= argc )
			{
				die(usage);
			}
			else
			{
				msk_file = argv[i];
			}
		}
		else if( !strcmp(argv[i], "-d") || !strcmp(argv[i], "--deterministic") )
		{
			pbc_random_set_deterministic(0);
		}
	}
	if( !msk_file || !pub_file)			//check if the parser updated the pub and msk file name
	{
		die(usage);
	}
}
//    FUN NAME   ARGUMENTS
//	cpabe-setup -p keys/pub -m keys/msk
int
main( int argc, char** argv )
{
	bswabe_pub_t* pub;
	bswabe_msk_t* msk;

	printf ("cpabe-setup - Starting to parse arguments\n");
	parse_args(argc, argv);
	printf ("cpabe-setup - About to enter setup on libbswabe\n");
	bswabe_setup(&pub, &msk);

	printf ("cpabe-setup - Writing keys to files\n");
	spit_file(pub_file, bswabe_pub_serialize(pub), 1);
	spit_file(msk_file, bswabe_msk_serialize(msk), 1);

	return 0;
}
