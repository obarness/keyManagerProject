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
	char* path = "/home/omer/workspace/keyManagerProject/server/keys/";

	printf ("cpabe-setup - Starting to parse arguments\n");
	parse_args(argc, argv);
	printf("after parse: msk file:  %s \n" , msk_file);
	printf ("cpabe-setup - About to enter setup on libbswabe\n");
	bswabe_setup(&pub, &msk);

	printf ("cpabe-setup - Trying to write keys to files\n");

	int pathLength = strlen(path);
	int fileNameLength = strlen(pub_file);
	char pubFullPath[pathLength + fileNameLength];
	strcpy(pubFullPath, path);
	strcat(pubFullPath, "pubkeys/");
	strcat(pubFullPath, pub_file);
	printf ("pubFullPath: \n", pubFullPath);
	spit_file(pubFullPath, bswabe_pub_serialize(pub), 1);


	pathLength = strlen(path);
	fileNameLength = strlen(msk_file);
	char mskFullPath[pathLength + fileNameLength];
	strcpy(mskFullPath, path);
	strcat(mskFullPath, "masterkeys/");
	strcat(mskFullPath, msk_file);

	spit_file(mskFullPath, bswabe_msk_serialize(msk), 1);
	printf ("cpabe-setup - Finished Writing keys to files\n");
	return 0;
}
